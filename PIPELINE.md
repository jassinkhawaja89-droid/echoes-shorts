# Echoes of Wisdom: daily animated history short

Channel: **Echoes of Wisdom** (@eow1.0), YouTube channel id `UC4jiiGX3DXTIAK3p0x67O5Q`, connected in vidIQ.
Look: flat 2D bean-head cartoon cards in a toon-shaded 3D world with ink outlines (see `examples/`).
Narration: Kokoro voice `bm_lewis` (British male), made by `tools/tts.py`. English.
Output: 1080x1920, 30 fps, **max 30 s** (user requirement, target 25-29.5 s). Music bed and SFX at 50 % of the voice level (`tools/mix.py`).

## Daily steps

1. **Setup.** `bash tools/setup.sh ~/short` (copies the engine and tools, installs playwright, kokoro-onnx, starts a local server on :8790).
   If the `cartoon-audio-short` skill is available, follow its rules for motion, look check and audio levels.
2. **Topic.** Use vidIQ to find what works: `vidiq_channel_videos` / `vidiq_channel_analytics` for the channel above, plus
   `vidiq_outliers` or `vidiq_trending_videos` for history / "true story" shorts. Skip anything listed in `topics.md` AND anything already on the channel (check `vidiq_channel_videos` channelId UC4jiiGX3DXTIAK3p0x67O5Q videoFormat short). Prefer the next unused idea from the backlog in `topics.md` unless vidIQ shows a clearly stronger trend.
   Pick one surprising, verifiable story with a physical cause-and-effect and a twist in the last line.
   Verify the key facts with a web search. No real living people, nothing graphic, nothing political. Not aimed at kids.
3. **Script.** English, 60-70 words (Lewis at speed 0.95 speaks ~2.6 words/s incl. pauses; the voice must end by 29 s), one sentence (or short phrase) per line in `script.txt`:
   hook (paradox as fact) -> setting -> 2-4 escalating beats -> pivot -> short ironic twist as the final words.
   Numbers written as words.
4. **Voice.** `python3 tts.py script.txt` -> `voice.wav` and `work/phrases.json` (exact start/end of every line, frames = seconds x 30).
5. **Build.** Start from the closest example in `examples/` (emu = rural/army, eiffel = Paris/salon/street/car, reis = Lisbon/prison/office/London/press/bank, zanzibar = harbour/sea/warships/palace balcony/collapse/sinking yacht/clock tower, pigwar = farm/potato patch/pig card/log cabin/pine forest/soldier lines/flags/rifle aim, wojtek = WWII camp/tents/bear card/desert/troop ship quay/desk stamp/artillery/badge board, dancing = medieval half-timber square/street/night lanterns/dancer crowd/stage+band/scroll, rats = medieval court on a stage/judge desk+gavel/rat & cat cards/barley field/villages from above/road with cats, meat = farm yard/soap kettle+fire/falling chunks/thought bubbles/scientists' table/vultures in the sky, whale = beach+sea/3D whale/dynamite crates/explosion/blubber rain/1970 car with crushed roof/seagulls, coffee = papal hall with throne+marble+curtains/side table/coffee cup card with steam, horns and halo/Venice quay with palazzi and boat/person holding a cup).
   fx cards whose size changes over time are scaled from their first size (fixed 2026-11-23 in rats/meat main.js: copy the `size0` logic); always check animated-size fx in the real render, not only in stills.
   Write `web/story.js` (one shot per line, cameras, actors, lights) and the world section of `web/main.js`, add outfits in `web/cast.js`.
   Rules learned so far: characters never stand inside furniture (keep cards >0.5 m from tables/walls; seated people beside the table at y 0.42);
   hats sit low on the head; every shot has camera motion and characters sway/walk/gesture; when someone gets into a car he really climbs in (door opens);
   diegetic text must read correctly; avoid real logos and real banknote designs.
6. **Look check.** `node render.mjs stills/a "<mid frame of every shot>"` then `python3 sheet.py stills/a stills/sheet.jpg 6`, look at it, fix framing
   (vertical frame is narrow: keep the subject within ~13 deg of the view axis).
7. **Sound.** Rewrite the cue table in `audio.py` for the story (music stops at the twist, button on the last word), `python3 audio.py <duration>`,
   `python3 mix.py voice.wav music.wav sfx.wav` (must print music -6.0 dB vs voice, sfx at or below).
8. **Render.** Two processes in parallel: `node render.mjs frames "0-<N/2>"` and `node render.mjs frames "<N/2+1>-<N-1>"`, then `bash finish.sh "<Title>"`.
   Check `out/qa_sheet.jpg`: no frozen spans, no black frames.
   Check duration with ffprobe. If it is over 30 s: `python3 tools/tighten.py out/<Title>.mp4 voice.wav out/<Title>_30.mp4 29.5`
   (shrinks voice pauses, then a pitch-safe speed-up; keep the speed-up below x1.1, otherwise shorten the script instead).
9. **Upload to vidIQ.** (GitHub releases are blocked for this session type.) Commit the MP4 to the orphan branch `videos`
   as `videos/<YYYY-MM-DD>_<Slug>.mp4`: `git fetch origin videos && git worktree add /tmp/v videos`, copy, commit, `git -c push.negotiate=true push origin videos`.
   The repo is public, so pass `https://raw.githubusercontent.com/jassinkhawaja89-droid/echoes-shorts/videos/videos/<file>.mp4`
   to `vidiq_video_upload` (url) -> `uploadId` (status ready). Verified working on 2026-11-20.
   GitHub rejects files over 100 MB: if the MP4 is bigger, re-encode with `-crf 20 -maxrate 18M -bufsize 36M -c:a copy` first.
10. **Metadata.** `vidiq_generate_titles` (type short, language en) -> pick the best scored title (<= 70 chars).
    **Final title is ALL CAPS** (Jassin, 2026-11-22), only hashtags stay lowercase, e.g. `WHY THIS BEAR WAS ENLISTED AS A PRIVATE #history #ww2 #shorts`. Score first, then uppercase.
    Description: 2-3 sentences that tease the story, one line "True story from <year>." (or "Legend says..."), then `#shorts #history #truestory` + 2 topic tags.
    10-15 tags.
11. **Draft + approval.** `vidiq_social_post_draft_create` with destination YOUTUBE, platformAccountId `UC4jiiGX3DXTIAK3p0x67O5Q`,
    privacyStatus `public`, categoryId 27, title, text (= description), tags, media = the uploadId.
    Send the user the MP4 (SendUserFile) plus title/description and ask for a "ja". Publish with `vidiq_social_post_publish`
    **only after the user approves**.
11b. **YouTube settings (Jassin, 2026-11-24, required for views).** Every video: audience "No, it's not made for kids", NO paid promotion, "Altered or synthetic content: Yes" (AI-generated).
    vidIQ cannot set these fields yet: set them in YouTube Studio with a browser tool if one is available, otherwise remind Jassin with the Studio link
    `https://studio.youtube.com/video/<VIDEO_ID>/edit` for each video.
12. **Log.** Append `YYYY-MM-DD | title | topic` to `topics.md`, commit and push.
