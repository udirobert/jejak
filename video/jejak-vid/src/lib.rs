//! Jejak field-journal video — judges cut (1440x900) + social cut (1080x1350).
//! One Shot scene per beat; the "camera" is an eased focus-rect over the footage.
use fframes::{
    AudioMap, AudioTimestamp::*, AudioTrack, Color, Duration, FFramesContext, FFramesSyncedVideoFrame,
    Frame, Overlap, Scene, Scenes, Svgr, SyncVideoFrameInput, Video, include_media_dir,
};

include_media_dir!(pub struct JejakVidMedia, "media");

const PAPER: &str = "#F3EDE2";
const INK: &str = "#1E1B16";
const STAMP: &str = "#C8442B";

// ---------- easing ----------
fn smooth(p: f32) -> f32 { let p = p.clamp(0., 1.); p * p * (3. - 2. * p) }
fn ease_out(p: f32) -> f32 { let p = p.clamp(0., 1.); 1. - (1. - p).powi(3) }
fn ease_out_expo(p: f32) -> f32 { if p >= 1. { 1. } else { 1. - 2f32.powf(-10. * p.clamp(0., 1.)) } }
fn lerp(a: f32, b: f32, p: f32) -> f32 { a + (b - a) * p }

// ---------- media ----------
fn clip_svgr<'a>(frame: &mut Frame, ctx: &FFramesContext<'a, '_>, name: &str, iw: f32, ih: f32) -> Option<Svgr<'a>> {
    let input = SyncVideoFrameInput { start_from: 0.0, looping: false, editor_fallback_image: None };
    let img = frame.get_synced_video_frame(ctx, name, &input)?.into_image();
    let href = img.href().to_owned();
    Some(fframes::svgr!(<image href={href} x="0" y="0" width={iw} height={ih} preserveAspectRatio="none" />))
}

/// A focused footage still or clip: cover-fits the canvas, eased zoom+pan around a focus point.
/// fx/fy = focus point in source space (0..1); z0->z1 zoom over the shot; enter slides in.
#[derive(Debug, Clone)]
pub struct Shot {
    pub clip: Option<&'static str>,
    pub still: Option<&'static str>,
    pub dur: f32,
    pub overlap: f32,          // seconds of crossfade/handoff onto previous shot
    pub z0: f32, pub z1: f32,  // zoom factor over the shot (>1 = punch in)
    pub fx0: f32, pub fy0: f32, pub fx1: f32, pub fy1: f32, // focus pan, 0..1 of source
    pub whip_in: bool,         // fast slide-in during overlap (momentum handoff)
    pub tear: bool,            // diagonal paper-tear wipe-in during overlap
    pub label: Option<&'static str>, // small plexmono corner tag
}

impl Default for Shot {
    fn default() -> Self {
        Shot { clip: None, still: None, dur: 4.0, overlap: 0., z0: 1.0, z1: 1.0,
            fx0: 0.5, fy0: 0.5, fx1: 0.5, fy1: 0.5, whip_in: false, tear: false, label: None }
    }
}
impl Shot {
    fn src(&self) -> (f32, f32) {
        if self.clip.is_some() { (1440., 900.) } else { (1920., 1080.) }
    }
}

impl Scene for Shot {
    fn duration(&self) -> Duration<'_> { Duration::Seconds(self.dur) }
    fn overlap(&self) -> Overlap { Overlap::Previous(self.overlap) }

    fn render_frame<'a>(&'a self, mut frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let (cw, ch) = (ctx.current_video_size.width as f32, ctx.current_video_size.height as f32);
        let t = frame.seconds();
        let dur = self.dur;
        // camera progress over the whole shot
        let p = smooth(t / dur);
        let z = lerp(self.z0, self.z1, p);
        let fx = lerp(self.fx0, self.fx1, p);
        let fy = lerp(self.fy0, self.fy1, p);

        let (sw, sh) = self.src();
        let k = (cw / sw).max(ch / sh) * z; // cover + camera zoom
        let iw = sw * k;
        let ih = sh * k;
        // place so focus point sits at canvas centre
        let mut x = cw / 2. - fx * iw;
        let y = ch / 2. - fy * ih;

        // whip: fast slide-in from the right during the overlap window
        if self.whip_in && self.overlap > 0. && t < self.overlap {
            x += (1. - ease_out_expo(t / self.overlap)) * cw;
        }
        // tear: clip the incoming scene to a growing diagonal band
        let tear_clip = if self.tear && self.overlap > 0. && t < self.overlap {
            let p = ease_out(t / self.overlap);
            let edge = -0.2 * cw + p * 1.4 * cw;
            Some(format!("polygon(0 0, {e}px 0, {e2}px 100%, 0 100%)", e = edge + 140., e2 = edge - 140.))
        } else { None };

        let layer: Option<Svgr> = if let Some(name) = self.clip {
            clip_svgr(&mut frame, ctx, name, iw, ih)
        } else if let Some(name) = self.still {
            ctx.get_image(name).map(|img| {
                let href = img.href().to_owned();
                fframes::svgr!(<image href={href} x="0" y="0" width={iw} height={ih} preserveAspectRatio="none" />)
            })
        } else { None };

        let label = self.label.map(|txt| {
            let fade = ease_out((t - 0.4).max(0.) / 0.4) * ease_out((dur - t - 0.3).max(0.) / 0.3);
            fframes::svgr!(
                <text x={24.} y={ch - 28.} font-family="IBM Plex Mono Medium" font-size={15. * ch / 900.}
                    font-weight="500" letter-spacing="2" fill={INK} opacity={fade * 0.85}>{txt}</text>
            )
        });

        fframes::svgr!(
            <svg xmlns="http://www.w3.org/2000/svg" width={cw} height={ch}>
                <rect width={cw} height={ch} fill={PAPER} />
                <g transform={format!("translate({x} {y})")}
                    style={tear_clip.map(|c| format!("clip-path: {c}")).unwrap_or_default()}>
                    {layer.unwrap_or_default()}
                </g>
                {label.unwrap_or_default()}
            </svg>
        )
    }
}

// ---------- shots ----------
macro_rules! shot { ($name:literal, $dur:expr $(, $($k:ident : $v:expr),*)? $(,)?) => {
    Shot { clip: Some($name), dur: $dur $(, $($k: $v),*)? , ..Default::default() }
}}
macro_rules! card { ($name:literal, $dur:expr $(, $($k:ident : $v:expr),*)? $(,)?) => {
    Shot { still: Some($name), dur: $dur $(, $($k: $v),*)? , ..Default::default() }
}}

// ---------- VO cue times (measured audio lengths + 0.25s breath) ----------
pub mod social_vo {
    pub const S: [(&str, f32); 7] = [
        ("s01.mp3", 0.00), ("s02.mp3", 5.73), ("s03.mp3", 11.55), ("s04.mp3", 15.75),
        ("s05.mp3", 21.30), ("s06.mp3", 27.50), ("s07.mp3", 31.50),
    ];
}
pub mod judges_vo {
    pub const S: [(&str, f32); 8] = [
        ("j01.mp3", 0.00), ("j02.mp3", 14.50), ("j03.mp3", 23.70), ("j04.mp3", 34.10),
        ("j05.mp3", 38.80), ("j06.mp3", 57.80), ("j07.mp3", 70.10), ("j09.mp3", 86.40),
    ];
}

fn vo_tracks(lines: &'static [(&'static str, f32)]) -> Vec<AudioTrack<'static>> {
    lines.iter().map(|(f, s)| AudioTrack::new(*f, Second(*s)..Eof).voice()).collect()
}

// ================= SOCIAL CUT (4:5) =================
pub struct SocialCut<'a> {
    pub media: &'a JejakVidMedia,
    shots: Vec<Shot>,
}
impl<'a> SocialCut<'a> {
    pub fn new(media: &'a JejakVidMedia) -> Self {
        Self {
            media,
            shots: vec![
                shot!("seg-globe-spin.mp4", 2.6, z0: 1.04, z1: 1.12),                       // G1 cold open mid-spin
                shot!("seg-globe-morph.mp4", 2.9, z0: 1.06, z1: 1.0),                       // morph back to ink
                shot!("seg-honesty.mp4", 5.6, z0: 1.08, z1: 1.18, fx0: 0.72, fx1: 0.78, fy0: 0.42, fy1: 0.6, label: Some("READ · CHECKED · ESTIMATED")),
                shot!("seg-transform.mp4", 3.9, z0: 1.0, z1: 1.06),                         // photo->sketch->IDENTIFIED
                shot!("seg-split.mp4", 5.3, overlap: 0.4, whip_in: true, z0: 1.05, z1: 1.12, fy0: 0.55, fy1: 0.6),
                shot!("seg-receipt-fill.mp4", 5.9, overlap: 0.35, fx0: 0.45, fx1: 0.62, z0: 1.04, z1: 1.0),
                shot!("seg-proof.mp4", 3.8, z0: 1.02, z1: 1.09, fy0: 0.5, fy1: 0.55),
                card!("end-169.png", 6.9, overlap: 0.4, z0: 1.0, z1: 1.03),
            ],
        }
    }
}
impl std::fmt::Debug for SocialCut<'_> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result { f.debug_struct("SocialCut").finish() }
}
impl Video for SocialCut<'_> {
    const FPS: usize = 30;
    const WIDTH: usize = 1080;
    const HEIGHT: usize = 1350;
    const BACKGROUND_COLOR: Color = Color::WHITE;
    fn duration(&self) -> Duration<'_> { Duration::Auto }
    fn define_scenes(&self) -> Scenes<'_> { Scenes::from(self.shots.iter().map(|s| s as &dyn Scene).collect::<Vec<_>>()) }
    fn audio(&self) -> AudioMap<'_> {
        let mut t = vec![
            AudioTrack::new("elcaro-bed.mp3", Second(0.)..Eof).gain_db(-19.).fade_in(0.8).duck_under_voice(),
            AudioTrack::new("whoosh-short.mp3", Second(26.9)..Eof).gain_db(-10.), // whip into split
            AudioTrack::new("impact-bass-1.mp3", Second(11.55 + 3.1)..Eof).gain_db(-9.), // IDENTIFIED thunk
        ];
        t.extend(vo_tracks(&social_vo::S));
        AudioMap::from(t)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        fframes::svgr!(
            <svg xmlns="http://www.w3.org/2000/svg" width={Self::WIDTH} height={Self::HEIGHT}>
                <rect width={Self::WIDTH} height={Self::HEIGHT} fill={PAPER} />
                {ctx.render_scenes(&frame)}
                <text x="40" y="90" font-family="IBM Plex Mono Medium" font-size="26" font-weight="500"
                    letter-spacing="4" fill={STAMP} opacity="0.9">{"JEJAK"}</text>
            </svg>
        )
    }
}

// ================= STELLAR CUT (16:9) =================
pub struct StellarCut<'a> {
    pub media: &'a JejakVidMedia,
    shots: Vec<Shot>,
}
impl<'a> StellarCut<'a> {
    pub fn new(media: &'a JejakVidMedia) -> Self {
        Self {
            media,
            shots: vec![
                // S0: cold open — title card sets the journal register
                card!("title-169.png", 1.7, z0: 1.0, z1: 1.05),
                // S1: passkey smart account — the OZ kit, no seed phrase
                shot!("seg-stellar-passport.mp4", 4.4, overlap: 0.4, z0: 1.1, z1: 1.2,
                    fx0: 0.5, fx1: 0.5, fy0: 0.6, fy1: 0.65,
                    label: Some("OPENZEPPELIN SMART ACCOUNT KIT · PASSKEY SIGNER")),
                // S2: stake the guess — reveal → hash commit → pool settles.
                // Camera drifts down so the anchor/settle chips stay in frame.
                shot!("seg-stellar-stake.mp4", 6.5, overlap: 0.5, whip_in: true, z0: 1.05, z1: 1.12,
                    fx0: 0.42, fx1: 0.44, fy0: 0.5, fy1: 0.62,
                    label: Some("MEMO-HASH COMMIT · SHA-256 BEFORE REVEAL")),
                // S3: connective beat — why the chain is there at all
                card!("bridge-169.png", 1.6, overlap: 0.35, z0: 1.0, z1: 1.03),
                // S4: credibility beat — settle tx live on stellar.expert,
                // pushing toward the claimable-balance operation row
                shot!("seg-stellar-explorer.mp4", 4.2, overlap: 0.4, z0: 1.04, z1: 1.12,
                    fx0: 0.5, fx1: 0.5, fy0: 0.55, fy1: 0.62,
                    label: Some("CAP-23 CLAIMABLE BALANCE · POT NOT CUSTODIAL")),
                // S5: end card — the composed primitives, in writing
                card!("end-stellar-169.png", 4.2, overlap: 0.45, z0: 1.0, z1: 1.03),
            ],
        }
    }
}
impl std::fmt::Debug for StellarCut<'_> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result { f.debug_struct("StellarCut").finish() }
}
impl Video for StellarCut<'_> {
    const FPS: usize = 30;
    const WIDTH: usize = 1440;
    const HEIGHT: usize = 900;
    const BACKGROUND_COLOR: Color = Color::WHITE;
    fn duration(&self) -> Duration<'_> { Duration::Auto }
    fn define_scenes(&self) -> Scenes<'_> { Scenes::from(self.shots.iter().map(|s| s as &dyn Scene).collect::<Vec<_>>()) }
    fn audio(&self) -> AudioMap<'_> {
        AudioMap::from([
            AudioTrack::new("music-bed.mp3", Second(0.)..Eof).gain_db(-19.).fade_in(1.0).fade_out(2.0),
            AudioTrack::new("whoosh.mp3", Second(5.0)..Eof).gain_db(-10.),        // whip into stake
            AudioTrack::new("impact-bass-1.mp3", Second(13.9)..Eof).gain_db(-9.), // explorer cut
        ])
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        fframes::svgr!(
            <svg xmlns="http://www.w3.org/2000/svg" width={Self::WIDTH} height={Self::HEIGHT}>
                <rect width={Self::WIDTH} height={Self::HEIGHT} fill={PAPER} />
                {ctx.render_scenes(&frame)}
            </svg>
        )
    }
}

// ================= JUDGES CUT (16:9) =================
pub struct JudgesCut<'a> {
    pub media: &'a JejakVidMedia,
    shots: Vec<Shot>,
}
impl<'a> JudgesCut<'a> {
    pub fn new(media: &'a JejakVidMedia) -> Self {
        Self {
            media,
            shots: vec![
                card!("title-169.png", 3.0, z0: 1.0, z1: 1.02),                                // J1
                shot!("seg-ambient.mp4", 6.0, overlap: 0.5, z0: 1.0, z1: 1.07, fx0: 0.45, fx1: 0.55), // J2 ships
                shot!("seg-drawon.mp4", 5.3, z0: 1.02, z1: 1.1),                                // J3 route draws
                shot!("seg-hero.mp4", 8.9, overlap: 0.4, z0: 1.0, z1: 1.05),                    // J4 JEJAK hero
                shot!("seg-honesty.mp4", 10.2, fx0: 0.7, fx1: 0.78, fy0: 0.4, fy1: 0.62, z0: 1.04, z1: 1.12),          // J5 three fact rows
                shot!("seg-split.mp4", 4.5, overlap: 0.35, whip_in: true, z0: 1.04, z1: 1.1),    // J6 guess->reveal
                shot!("seg-describe.mp4", 6.7, z0: 1.0, z1: 1.05),                              // J7 describe->trace
                shot!("seg-receipt-fill.mp4", 6.5, overlap: 0.35, fx0: 0.45, fx1: 0.6),          // J8 receipt fills
                shot!("seg-receipt-cards.mp4", 5.6, fx0: 0.5, fy0: 0.35, fy1: 0.55, z1: 1.04),   // J9 entries appear
                shot!("seg-letter.mp4", 12.0, overlap: 0.4, z0: 1.0, z1: 1.06, fy0: 0.45, fy1: 0.55), // J10 letter
                shot!("seg-globe-flip.mp4", 5.9, overlap: 0.5, tear: true, z0: 1.02, z1: 1.0),   // J11 morph (page-tear)
                shot!("seg-ticker.mp4", 5.1, fy0: 0.75, fy1: 0.72, z0: 1.08, z1: 1.04),           // J13 ticker close-up
                shot!("seg-streak.mp4", 6.0, overlap: 0.35, z0: 1.02, z1: 1.08),                  // J14 streak->impact
                // J15-17: Stellar block — the wager proof, closing act
                shot!("seg-stellar-passport.mp4", 4.0, overlap: 0.45, z0: 1.1, z1: 1.18,
                    fx0: 0.5, fx1: 0.5, fy0: 0.6, fy1: 0.64,
                    label: Some("OPENZEPPELIN SMART ACCOUNT KIT")),
                shot!("seg-stellar-stake.mp4", 4.5, overlap: 0.4, whip_in: true, z0: 1.06, z1: 1.12,
                    fx0: 0.42, fx1: 0.44, fy0: 0.52, fy1: 0.62,
                    label: Some("MEMO-HASH COMMIT · SHA-256")),
                shot!("seg-stellar-explorer.mp4", 4.0, overlap: 0.4, z0: 1.04, z1: 1.12,
                    fx0: 0.5, fx1: 0.5, fy0: 0.55, fy1: 0.62,
                    label: Some("CAP-23 CLAIMABLE BALANCE · NOT CUSTODIAL")),
                card!("end-stellar-169.png", 6.5, overlap: 0.5, z0: 1.0, z1: 1.03),
            ],
        }
    }
}
impl std::fmt::Debug for JudgesCut<'_> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result { f.debug_struct("JudgesCut").finish() }
}
impl Video for JudgesCut<'_> {
    const FPS: usize = 30;
    const WIDTH: usize = 1440;
    const HEIGHT: usize = 900;
    const BACKGROUND_COLOR: Color = Color::WHITE;
    fn duration(&self) -> Duration<'_> { Duration::Auto }
    fn define_scenes(&self) -> Scenes<'_> { Scenes::from(self.shots.iter().map(|s| s as &dyn Scene).collect::<Vec<_>>()) }
    fn audio(&self) -> AudioMap<'_> {
        let mut t = vec![
            AudioTrack::new("music-bed.mp3", Second(0.)..Eof).gain_db(-19.).fade_in(1.2).fade_out(2.5).duck_under_voice(),
            AudioTrack::new("whoosh.mp3", Second(37.4)..Eof).gain_db(-10.),      // whip into split
            AudioTrack::new("whoosh-cinematic.mp3", Second(69.6)..Eof).gain_db(-12.), // page-tear into globe
            AudioTrack::new("whoosh.mp3", Second(89.3)..Eof).gain_db(-10.),       // whip into stake
            AudioTrack::new("impact-bass-2.mp3", Second(93.5)..Eof).gain_db(-9.), // explorer cut
            AudioTrack::new("impact-bass-1.mp3", Second(23.9)..Eof).gain_db(-9.), // fact-row stamps
        ];
        t.extend(vo_tracks(&judges_vo::S));
        AudioMap::from(t)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        fframes::svgr!(
            <svg xmlns="http://www.w3.org/2000/svg" width={Self::WIDTH} height={Self::HEIGHT}>
                <rect width={Self::WIDTH} height={Self::HEIGHT} fill={PAPER} />
                {ctx.render_scenes(&frame)}
            </svg>
        )
    }
}
