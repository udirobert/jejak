use fframes::{EncoderOptions, RenderOptions, StaticMediaProvider, cli};
use fframes_skia_renderer::{
    SkiaFFramesRenderer, SkiaPipelineConcurrencyPolicy, SkiaPipelineConfig,
    metal::SkiaMetalCtx,
};
use jejak_vid::{JejakVidMedia, JudgesCut, SocialCut, StellarCut};
use fframes::cli::clap;
use std::process::ExitCode;

#[derive(Debug, clap::Args)]
struct VideoArgs {
    #[arg(long, default_value = "judges", global = true)]
    cut: String,
}

fn main() -> ExitCode {
    let args = cli::parse::<VideoArgs>();
    let static_media = JejakVidMedia::prepare().expect("media");
    let dir = fframes::MediaDirectory::read_folder("assets").expect("assets dir");
    let runtime_media = dir.process_media_source().expect("runtime media");
    let media = fframes::CombinedMediaProvider::from([
        &static_media as &dyn fframes::MediaProvider,
        &runtime_media,
    ]);

    // Re-parse so `cut` is visible (cli::parse already ran inside run(); parse once here and pass args down)
    let cut = args.app.cut.clone();
    if cut == "stellar" {
        let video = StellarCut::new(&static_media);
        let gpu = SkiaMetalCtx::new(1440, 900).expect("GPU context");
        cli::new(
            &video,
            RenderOptions {
                media: Some(&media),
                audio_mix: fframes::AudioMixOptions { master_gain_db: 5.5, ..Default::default() },
                video_encoder_options: EncoderOptions {
                    preferred_encoder: Some("libx264"),
                    codec_params: Some(&[("crf", "20"), ("preset", "medium"), ("tune", "animation")]),
                    ..Default::default()
                },
                ..Default::default()
            },
        )
        .args(args)
        .backend(
            SkiaFFramesRenderer::new_metal(
                &gpu,
                SkiaPipelineConfig {
                    concurrency_policy: SkiaPipelineConcurrencyPolicy::MaxPerformance,
                    ..Default::default()
                },
            )
            .expect("skia renderer"),
        )
        .preview(fframes_native_player::cli_preview)
        .run()
    } else if cut == "social" {
        let video = SocialCut::new(&static_media);
        let gpu = SkiaMetalCtx::new(1080, 1350).expect("GPU context");
        cli::new(
            &video,
            RenderOptions {
                media: Some(&media),
                audio_mix: fframes::AudioMixOptions { master_gain_db: 5.5, ..Default::default() },
            video_encoder_options: EncoderOptions {
                    preferred_encoder: Some("libx264"),
                    codec_params: Some(&[("crf", "20"), ("preset", "medium"), ("tune", "animation")]),
                    ..Default::default()
                },
                ..Default::default()
            },
        )
        .args(args)
        .backend(
            SkiaFFramesRenderer::new_metal(
                &gpu,
                SkiaPipelineConfig {
                    concurrency_policy: SkiaPipelineConcurrencyPolicy::MaxPerformance,
                    ..Default::default()
                },
            )
            .expect("skia renderer"),
        )
        .preview(fframes_native_player::cli_preview)
        .run()
    } else {
        let video = JudgesCut::new(&static_media);
        let gpu = SkiaMetalCtx::new(1440, 900).expect("GPU context");
        cli::new(
            &video,
            RenderOptions {
                media: Some(&media),
                audio_mix: fframes::AudioMixOptions { master_gain_db: 5.5, ..Default::default() },
            video_encoder_options: EncoderOptions {
                    preferred_encoder: Some("libx264"),
                    codec_params: Some(&[("crf", "20"), ("preset", "medium"), ("tune", "animation")]),
                    ..Default::default()
                },
                ..Default::default()
            },
        )
        .args(args)
        .backend(
            SkiaFFramesRenderer::new_metal(
                &gpu,
                SkiaPipelineConfig {
                    concurrency_policy: SkiaPipelineConcurrencyPolicy::MaxPerformance,
                    ..Default::default()
                },
            )
            .expect("skia renderer"),
        )
        .preview(fframes_native_player::cli_preview)
        .run()
    }
}
