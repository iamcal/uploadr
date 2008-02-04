// FFmpeg testing

// Goofy FFmpeg requires C linkage
extern "C" {
#include <avcodec.h>
#include <avformat.h>
}

// GraphicsMagick
#include "Magick++.h"

// Exiv2
#include "image.hpp"
#include "exif.hpp"
#include "iptc.hpp"

#include <stdio.h>
#include <sstream>
#include <string>

#define round(n) (int)(0 <= (n) ? (n) + 0.5 : (n) - 0.5)

using namespace std;

//
// Code headed directly into XPCOM
//

//NS_IMETHODIMP flGM::Keyframe(PRInt32 square, const nsAString & path, nsAString & _retval) {
int Keyframe(int square, char * path, string & _retval) {

	// Open the file
	av_register_all();
	AVFormatContext *format_ctx;
	if (av_open_input_file(&format_ctx, path, 0, 0, 0)) {
		return 1;
	}
	if (0 > av_find_stream_info(format_ctx)) {
		return 1;
	}
	int stream = -1;
	for (int i = 0; i < format_ctx->nb_streams; ++i) {
		if (CODEC_TYPE_VIDEO == format_ctx->streams[i]->codec->codec_type) {
			stream = i;
			break;
		}
	}
	if (-1 == stream) {
		return 1;
	}
	AVCodecContext * codec_ctx = format_ctx->streams[stream]->codec;
	AVCodec * codec = avcodec_find_decoder(codec_ctx->codec_id);
	if (0 == codec) {
		fprintf(stderr, "[FFmpeg] Unsupported codec\n");
		return 1;
	}
	if(0 > avcodec_open(codec_ctx, codec)) {
		return 1;
	}
	AVFrame * video_frame = avcodec_alloc_frame();
	AVFrame * img_frame = avcodec_alloc_frame();
	if (!video_frame || !img_frame) {
		return 1;
	}
	int bytes = avpicture_get_size(PIX_FMT_RGB24, codec_ctx->width,
		codec_ctx->height);
	uint8_t * buffer = (uint8_t *)av_malloc(bytes * sizeof(uint8_t));
	if (!buffer) {
		return 1;
	}
	avpicture_fill((AVPicture *)img_frame, buffer, PIX_FMT_RGB24,
		codec_ctx->width, codec_ctx->height);

	// Print metadata
	printf("[Metadata] timestamp: %d\n", format_ctx->timestamp);
	printf("[Metadata] title: %s\n", format_ctx->title);
	printf("[Metadata] author: %s\n", format_ctx->author);
	printf("[Metadata] copyright: %s\n", format_ctx->copyright);
	printf("[Metadata] comment: %s\n", format_ctx->comment);
	printf("[Metadata] album: %s\n", format_ctx->album);
	printf("[Metadata] year: %d\n", format_ctx->year);
	printf("[Metadata] track: %d\n", format_ctx->track);
	printf("[Metadata] genre: %s\n", format_ctx->genre);

	// Play through 15% of the video
	int64_t seek = (int64_t)(0.15 * (double)format_ctx->duration *
		(double)codec_ctx->time_base.num / (double)codec_ctx->time_base.den);
	fprintf(stderr, "[FFmpeg] seek: %d\n", seek);
	int i = 0;
	AVPacket packet;
	int have_frame;
	while (0 <= av_read_frame(format_ctx, &packet)) {
		if (packet.stream_index == stream) {
			avcodec_decode_video(codec_ctx, video_frame, &have_frame,
				 packet.data, packet.size);
			if (have_frame && seek == ++i) {
				img_convert((AVPicture *)img_frame, PIX_FMT_RGB24,
					(AVPicture*)video_frame, codec_ctx->pix_fmt,
					codec_ctx->width, codec_ctx->height);

				// Convert the keyframe to a PPM in a byte array
				char header[32];
				sprintf(header, "P6\n%d %d\n255\n", codec_ctx->width,
					codec_ctx->height);
				int size = strlen(header) + 3 * codec_ctx->width *
					codec_ctx->height;
				char * bytes = (char *)malloc(size);
				if (!bytes) {
					fprintf(stderr, "[segfault] Null pointer to byte array\n");
					return 0;
				}
				memcpy(bytes, header, strlen(header));
				char * bytes_p = bytes + strlen(header);
				int b = codec_ctx->width * 3;
				int jj = codec_ctx->height;
				for (int j = 0; j < jj; ++j) {
					memcpy(bytes_p, img_frame->data[0] + j *
						img_frame->linesize[0], b);
					bytes_p += b;
				}

				// Convert the PPM array to a JPEG on disk
				try {
					Magick::Image img(Magick::Blob(bytes, size));

					// Output the size of the video and the embedded timestamp
					int bw = img.baseColumns(), bh = img.baseRows();
					ostringstream out;
					out << "###" << bw << "###" << bh << "###"
						<< format_ctx->timestamp << "###";

					// Resize the output as a thumbnail
					//   This is almost certainly overkill, as I've never
					//   seen a video in portrait mode
					ostringstream dim;
					if (bw > bh) {
						float r = (float)bh * (float)square / (float)bw;
						out << square << "###" << round(r);
						dim << square << "x" << round(r);
					} else {
						float r = (float)bw * (float)square / (float)bh;
						out << round(r) << "###" << square;
						dim << round(r) << "x" << square;
					}
					out << "###";

					// Resize and save the thumbnail
					img.scale(dim.str());
					img.compressType(Magick::NoCompression);
					img.write(string("ff_out_awesome.jpg"));
					out << "<thumb-path>";

					// If all went well, return stuff
					_retval = out.str();

				} catch (Magick::Exception & e) {
					printf("[GraphicsMagick] %s\n", e.what());
				}

				free(bytes);
				av_free_packet(&packet);
				break;
			}
		}
		av_free_packet(&packet);
	}

	// Clean yo' mess
	av_free(buffer);
	av_free(img_frame);
	av_free(video_frame);
	avcodec_close(codec_ctx);
	av_close_input_file(format_ctx);

	return 0;
}

int main(int argc, char *argv[]) {
	if (argc < 2) {
		printf("Usage: %s <image-file>\n", *argv);
		return 1;
	}

	// Call the fake XPCOM object
	int square = 100;
	char * path = argv[1];
	string _retval = "";
	Keyframe(square, path, _retval);
	printf("%s\n", _retval.c_str());

}