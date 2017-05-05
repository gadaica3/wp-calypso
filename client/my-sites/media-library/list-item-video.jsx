/**
 * External dependencies
 */
var React = require( 'react' ),
	photon = require( 'photon' );

/**
 * Internal dependencies
 */
var ListItemFileDetails = require( './list-item-file-details' ),
	Gridicon = require( 'gridicons' );

module.exports = React.createClass( {
	displayName: 'MediaLibraryListItemVideo',

	propTypes: {
		media: React.PropTypes.object,
		maxImageWidth: React.PropTypes.number,
		photon: React.PropTypes.bool,
		thumbnailSize: React.PropTypes.string,
	},

	getDefaultProps: function() {
		return {
			maxImageWidth: 450
		};
	},

	getHighestQualityThumbnail: function() {
		if ( this.props.media.thumbnails ) {
			return this.props.media.thumbnails.fmt_hd ||
				this.props.media.thumbnails.fmt_dvd ||
				this.props.media.thumbnails.fmt_std;
		}
	},

	shouldUsePhoton() {
		if ( this.props.photon || ! this.props.thumbnailSize ) {
			return true;
		}

		return false;
	},

	render: function() {
		const thumbnail = this.getHighestQualityThumbnail();

		if ( thumbnail ) {
			const url = this.shouldUsePhoton() ? photon( thumbnail, { width: this.props.maxImageWidth } ) : thumbnail;

			return (
				<div className="media-library__list-item-video" style={ { backgroundImage: 'url(' + url + ')' } }>
					<span className="media-library__list-item-icon media-library__list-item-centered">
						<Gridicon icon="video-camera"/>
					</span>
				</div>
			);
		} else {
			return <ListItemFileDetails { ...this.props } icon="video-camera" />;
		}
	}
} );
