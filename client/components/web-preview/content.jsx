/**
 * External dependencies
 */
import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import debugModule from 'debug';
import noop from 'lodash/noop';
import page from 'page';
import shallowCompare from 'react-addons-shallow-compare';
import { v4 as uuid } from 'uuid';
import addQueryArgs from 'lib/route/add-query-args';

/**
 * Internal dependencies
 */
import Toolbar from './toolbar';
import touchDetect from 'lib/touch-detect';
import { isMobile } from 'lib/viewport';
import { localize } from 'i18n-calypso';
import Spinner from 'components/spinner';
import SeoPreviewPane from 'components/seo-preview-pane';
import { recordTracksEvent } from 'state/analytics/actions';

const debug = debugModule( 'calypso:web-preview' );

export class WebPreviewContent extends Component {
	constructor( props ) {
		super( props );

		this.previewId = uuid();

		this._hasTouch = false;
		this._isMobile = false;

		this.state = {
			iframeUrl: null,
			device: props.defaultViewportDevice || 'computer',
			loaded: false
		};

		this.setIframeInstance = ref => this.iframe = ref;

		this.selectSEO = this.setDeviceViewport.bind( this, 'seo' );
		this.setDeviceViewport = this.setDeviceViewport.bind( this );
		this.setIframeMarkup = this.setIframeMarkup.bind( this );
		this.setIframeUrl = this.setIframeUrl.bind( this );
		this.setLoaded = this.setLoaded.bind( this );
		this.handleMessage = this.handleMessage.bind( this );
		this.focusIfNeeded = this.focusIfNeeded.bind( this );
	}

	componentWillMount() {
		// Cache touch and mobile detection for the entire lifecycle of the component
		this._hasTouch = touchDetect.hasTouch();
		this._isMobile = isMobile();
	}

	componentDidMount() {
		window.addEventListener( 'message', this.handleMessage );
		if ( this.props.previewUrl ) {
			this.setIframeUrl( this.props.previewUrl );
		}
		if ( this.props.previewMarkup ) {
			this.setIframeMarkup( this.props.previewMarkup );
		}

		if ( typeof this.props.onDeviceUpdate === 'function' ) {
			this.props.onDeviceUpdate( this.state.device );
		}
	}

	componentWillUnmount() {
		window.removeEventListener( 'message', this.handleMessage );
	}

	shouldComponentUpdate( nextProps, nextState ) {
		return shallowCompare( this, nextProps, nextState );
	}

	componentDidUpdate( prevProps ) {
		const { previewUrl } = this.props;

		this.setIframeUrl( previewUrl );

		// If the previewMarkup changes, re-render the iframe contents
		if ( this.props.previewMarkup && this.props.previewMarkup !== prevProps.previewMarkup ) {
			this.setIframeMarkup( this.props.previewMarkup );
		}
		// If the previewMarkup is erased, remove the iframe contents
		if ( ! this.props.previewMarkup && prevProps.previewMarkup ) {
			debug( 'removing iframe contents' );
			this.setIframeMarkup( '' );
		}
		// Focus preview when showing modal
		if ( this.props.showPreview && ! prevProps.showPreview && this.state.loaded ) {
			this.focusIfNeeded();
		}
	}

	handleMessage( e ) {
		try {
			const data = JSON.parse( e.data );
			if ( data.channel !== 'preview-' + this.previewId ) {
				return;
			}
			debug( 'message from iframe', data );
			switch ( data.type ) {
				case 'link':
					page( data.payload.replace( 'https://wordpress.com', '' ) );
					if ( typeof this.props.onClose === 'function' ) {
						this.props.onClose();
					}
					return;
				case 'close':
					if ( typeof this.props.onClose === 'function' ) {
						this.props.onClose();
					}
					return;
				case 'partially-loaded':
					this.setLoaded();
					return;
			}
		} catch ( err ) {}
	}

	focusIfNeeded() {
		// focus content unless we are running in closed modal or on empty page
		if ( this.iframe.contentWindow && this.state.iframeUrl !== 'about:blank' ) {
			debug( 'focusing iframe contents' );
			this.iframe.contentWindow.focus();
		}
	}

	setIframeMarkup( content ) {
		if ( ! this.iframe ) {
			debug( 'no iframe to update' );
			return;
		}
		debug( 'adding markup to iframe', content.length );
		this.iframe.contentDocument.open();
		this.iframe.contentDocument.write( content );
		this.iframe.contentDocument.close();
	}

	setIframeUrl( iframeUrl ) {
		if ( ! this.iframe || ( ! this.props.showPreview && this.props.isModalWindow ) ) {
			return;
		}

		// Bail if we've already set this url
		if ( iframeUrl === this.state.iframeUrl ) {
			return;
		}

		debug( 'setIframeUrl', iframeUrl );
		try {
			const newUrl = iframeUrl === 'about:blank'
				? iframeUrl
				: addQueryArgs( { calypso_token: this.previewId }, iframeUrl );
			this.iframe.contentWindow.location.replace( newUrl );
			this.setState( {
				loaded: false,
				iframeUrl: iframeUrl,
			} );
		} catch ( e ) {}
	}

	setDeviceViewport( device = 'computer' ) {
		this.setState( { device } );

		this.props.recordTracksEvent( 'calypso_web_preview_select_viewport_device', { device } );

		if ( typeof this.props.onDeviceUpdate === 'function' ) {
			this.props.onDeviceUpdate( device );
		}
	}

	setLoaded() {
		if ( this.state.loaded ) {
			debug( 'already loaded' );
			return;
		}
		if ( ! this.state.iframeUrl && ! this.props.previewMarkup ) {
			debug( 'preview loaded, but nothing to show' );
			return;
		}
		if ( this.props.previewMarkup ) {
			debug( 'preview loaded with markup' );
			this.props.onLoad( this.iframe.contentDocument );
		} else {
			debug( 'preview loaded for url:', this.state.iframeUrl );
		}
		this.setState( { loaded: true } );

		this.focusIfNeeded();
	}

	render() {
		const { translate } = this.props;

		const className = classNames( this.props.className, 'web-preview__inner', {
			'is-touch': this._hasTouch,
			'is-with-sidebar': this.props.hasSidebar,
			'is-visible': this.props.showPreview,
			'is-computer': this.state.device === 'computer',
			'is-tablet': this.state.device === 'tablet',
			'is-phone': this.state.device === 'phone',
			'is-seo': this.state.device === 'seo',
			'is-loaded': this.state.loaded,
		} );

		return (
			<div className={ className }>
				<Toolbar setDeviceViewport={ this.setDeviceViewport }
					device={ this.state.device }
					{ ...this.props }
					showExternal={ ( this.props.previewUrl ? this.props.showExternal : false ) }
					showDeviceSwitcher={ this.props.showDeviceSwitcher && ! this._isMobile }
					selectSeoPreview={ this.selectSEO }
				/>
				<div className="web-preview__placeholder">
					{ ! this.state.loaded && 'seo' !== this.state.device &&
						<div>
							<Spinner />
							{ this.props.loadingMessage &&
								<span className="web-preview__loading-message">
									{ this.props.loadingMessage }
								</span>
							}
						</div>
					}
					<div
						className={ classNames( 'web-preview__frame-wrapper', {
							'is-resizable': ! this.props.isModalWindow
						} ) }
						style={ { display: ( 'seo' === this.state.device ? 'none' : 'inherit' ) } }
					>
						<iframe
							ref={ this.setIframeInstance }
							className="web-preview__frame"
							src="about:blank"
							onLoad={ this.setLoaded }
							title={ this.props.iframeTitle || translate( 'Preview' ) }
						/>
					</div>
					{ 'seo' === this.state.device &&
						<SeoPreviewPane />
					}
				</div>
			</div>
		);
	}
}

WebPreviewContent.propTypes = {
	// Display the preview
	showPreview: PropTypes.bool,
	// Show external link button (only if there is a previewUrl)
	showExternal: PropTypes.bool,
	// Show close button
	showClose: PropTypes.bool,
	// Show SEO button
	showSEO: PropTypes.bool,
	// Show device viewport switcher
	showDeviceSwitcher: PropTypes.bool,
	// The URL that should be displayed in the iframe
	previewUrl: PropTypes.string,
	// The URL for the external link button
	externalUrl: PropTypes.string,
	// The markup to display in the iframe
	previewMarkup: PropTypes.string,
	// The viewport device to show initially
	defaultViewportDevice: PropTypes.string,
	// Elements to render on the right side of the toolbar
	children: PropTypes.node,
	// The function to call when the iframe is loaded. Will be passed the iframe document object.
	// Only called if using previewMarkup.
	onLoad: PropTypes.func,
	// Called when the preview is closed, either via the 'X' button or the escape key
	onClose: PropTypes.func,
	// Optional loading message to display during loading
	loadingMessage: PropTypes.string,
	// The iframe's title element, used for accessibility purposes
	iframeTitle: PropTypes.string,
	// Makes room for a sidebar if desired
	hasSidebar: React.PropTypes.bool,
	// Called after user switches device
	onDeviceUpdate: React.PropTypes.func,
	// Flag that differentiates modal window from inline embeds
	isModalWindow: React.PropTypes.bool
};

WebPreviewContent.defaultProps = {
	showExternal: true,
	showClose: true,
	showSEO: true,
	showDeviceSwitcher: true,
	previewUrl: null,
	previewMarkup: null,
	onLoad: noop,
	onClose: noop,
	onDeviceUpdate: noop,
	hasSidebar: false,
	isModalWindow: false,
};

export default connect( null, { recordTracksEvent } )( localize( WebPreviewContent ) );
