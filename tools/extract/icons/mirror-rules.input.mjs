// Authored input of data/icons/mirror-rules.json. mirror-rules.mjs checks every icon name cited here against
// data/icons/mirror-evidence.json and the source catalogs, and fails on a name that is not where the rule says it is.
//
// Evidence shorthand (all optional):
//   compose        names on the Compose Icons.AutoMirrored list
//   symbols        Material Symbols with android:autoMirrored="true"
//   symbolsNot     Material Symbols whose drawable was read and is not auto-mirrored
//   fluent         Fluent icons with directionType "mirror"
//   fluentLegacy   Fluent importer/rtl.txt
//   fluentUnique   Fluent icons with separately drawn RTL artwork (directionType "unique" or an LTR/RTL asset)
//   fluentNot      Fluent icons that have a metadata.json with no directionType
//   md / hig       what the Material guidance / Apple HIG says: 'mirror' | 'never' | 'conditional', plus an optional note
// Arabic concept names were written by the layer author and are not from an authoritative Arabic source: needs-review.

export const sources = [
  { id: 'compose', name: 'Jetpack Compose Icons.AutoMirrored (material-icons-core/extended 1.7.8)', kind: 'mechanical', url: 'https://developer.android.com/reference/kotlin/androidx/compose/material/icons/Icons.AutoMirrored', note: 'List: mirror-evidence compose-automirrored.' },
  { id: 'material-symbols', name: 'Material Symbols Android drawables (android:autoMirrored)', kind: 'mechanical', url: 'https://github.com/google/material-design-icons', note: 'List: mirror-evidence material-symbols-automirrored; negatives from sources/material-symbols.json autoMirrored=false.' },
  { id: 'fluent', name: 'Fluent UI System Icons metadata (directionType, LTR/RTL assets)', kind: 'mechanical', url: 'https://github.com/microsoft/fluentui-system-icons', note: 'Lists: fluent-direction-mirror, fluent-direction-unique, fluent-ltr-rtl-assets; negatives from sources/fluent.json.' },
  { id: 'fluent-legacy', name: 'Fluent UI System Icons importer/rtl.txt', kind: 'mechanical', url: 'https://github.com/microsoft/fluentui-system-icons/blob/main/importer/rtl.txt', note: 'List: fluent-android-rtl-txt.' },
  { id: 'material-guidelines', name: 'Material Design guidelines — Bidirectionality (archived Material 1 page, static HTML)', kind: 'guidance', url: 'https://m1.material.io/usability/bidirectionality.html', note: 'Read 2026-11-11. The Material 2 page (m2.material.io/design/usability/bidirectionality.html) is rendered client-side and could not be read by script; the archived page carries the same section structure (When to mirror / When not to mirror / The passage of time / Localization).' },
  { id: 'apple-hig', name: 'Apple Human Interface Guidelines — Right to left', kind: 'guidance', url: 'https://developer.apple.com/design/human-interface-guidelines/right-to-left', note: 'Read 2026-11-11 from the page\'s JSON document (developer.apple.com/tutorials/data/design/human-interface-guidelines/right-to-left.json).' },
  { id: 'unicode', name: 'The Unicode Standard — Arabic block (U+061F ARABIC QUESTION MARK, U+066A ARABIC PERCENT SIGN, U+0660–0669 ARABIC-INDIC DIGITS)', kind: 'guidance', url: 'https://www.unicode.org/charts/PDF/U0600.pdf', note: 'Character identities only.' },
]

export const principles = [
  { id: 'reading-direction', verdict: 'auto', statement: 'Whatever depicts movement forward or backward, the passage of linear time, or the order of items follows the reading direction and is mirrored in RTL: back/forward arrows, next/previous, progress, sliders.', sources: ['material-guidelines', 'apple-hig'] },
  { id: 'text-representation', verdict: 'auto', statement: 'An icon that depicts lines of text (ragged edge, indent, bullets, alignment) is mirrored so the lines start at the right.', sources: ['material-guidelines', 'apple-hig'] },
  { id: 'circular-time', verdict: 'never', statement: 'Circular time does not reverse: clocks, clockwise refresh and history arrows, circular progress keep their direction.', sources: ['material-guidelines', 'apple-hig'] },
  { id: 'media-direction', verdict: 'never', statement: 'Media playback controls and the media progress bar show the direction of the medium, not of reading, and are not mirrored.', sources: ['material-guidelines'] },
  { id: 'physical-object', verdict: 'never', statement: 'Icons of real-world objects that look the same everywhere (camera, keyboard, headset, clock) are not mirrored unless the object is used to show direction.', sources: ['material-guidelines', 'apple-hig'] },
  { id: 'right-hand', verdict: 'never', statement: 'Icons slanted for right-handed use (magnifier, cup, pen) are not mirrored: most RTL readers are right-handed too.', sources: ['material-guidelines', 'apple-hig'] },
  { id: 'universal-mark', verdict: 'never', statement: 'Logos and universal marks such as the checkmark are never mirrored.', sources: ['apple-hig'] },
  { id: 'slash-stays', verdict: 'never', statement: 'The slash that negates an icon keeps the same slant in both directions.', sources: ['material-guidelines', 'apple-hig'] },
  { id: 'numerals-letters', verdict: 'conditional', statement: 'Digits and letters inside an icon are never flipped. Their order may reverse when they show a sequence, and the glyphs should be localized (Arabic letters, the locale\'s digits) rather than mirrored.', sources: ['material-guidelines', 'apple-hig'] },
  { id: 'absolute-direction', verdict: 'never', statement: 'A control that refers to an actual direction or to an area of the screen keeps pointing there: "to the right" always points right.', sources: ['apple-hig'] },
  { id: 'composite', verdict: 'conditional', statement: 'A complex icon is judged part by part: a badge, slash or tool may stay while the base flips, and a badge that depicts real UI flips with the UI.', sources: ['apple-hig'] },
]

const r = (id, en, ar, verdict, reason, o = {}) => ({ id, en, ar, verdict, reason, ...o })

export const rules = [
  // ── mirror ────────────────────────────────────────────────────────────────────────────────────────────────
  r('back-forward-navigation', 'Back / forward, previous / next arrows and chevrons', 'أسهم الرجوع والتقدم والسابق والتالي', 'auto',
    'Back points to where reading came from. In RTL that is the right, so the back arrow and the "previous" chevron point right and "next" points left.', {
      principles: ['reading-direction'], md: ['mirror', 'Named as the most important icons to mirror.'], hig: ['mirror'],
      compose: ['ArrowBack', 'ArrowForward', 'ArrowBackIos', 'ArrowForwardIos', 'KeyboardArrowLeft', 'KeyboardArrowRight', 'NavigateBefore', 'NavigateNext', 'ArrowLeft', 'ArrowRight', 'ArrowRightAlt'],
      symbols: ['arrow_back', 'arrow_forward', 'chevron_left', 'chevron_right', 'chevron_backward', 'chevron_forward', 'arrow_left', 'arrow_right', 'navigate_before', 'navigate_next'],
      fluent: ['arrow_next', 'arrow_previous', 'arrow_forward'], fluentLegacy: ['arrow_left', 'arrow_right', 'chevron_left', 'chevron_right'],
      recommendation: 'Name the concept by meaning (back, forward, previous, next, chevron-start, chevron-end) and mirror it. Keep separate, never-mirrored physical left/right arrows for absolute directions (see absolute-direction-arrows).',
      examples: ['arrow-back', 'arrow-forward', 'chevron-start', 'chevron-end'] }),
  r('first-last-page', 'First page / last page, double chevrons', 'الصفحة الأولى والأخيرة والأسهم المزدوجة', 'auto',
    'Pagination ends follow reading order like single chevrons do.', {
      principles: ['reading-direction'], compose: ['LastPage'], symbols: ['last_page', 'keyboard_double_arrow_left', 'keyboard_double_arrow_right', 'double_arrow'], symbolsNot: ['first_page'],
      disagreement: 'Material Symbols auto-mirrors last_page but not first_page, and Compose lists LastPage without FirstPage. A pair that is mirrored on one side only is an upstream omission, not a principle.',
      recommendation: 'Mirror both.', examples: ['chevrons-start', 'chevrons-end', 'page-first', 'page-last'] }),
  r('diagonal-arrows', 'Diagonal arrows: open in new, external link, arrow up-right', 'الأسهم المائلة: فتح في نافذة جديدة والرابط الخارجي', 'auto',
    'A diagonal arrow leaves toward the end side of the line; in RTL it leaves toward the top-left.', {
      principles: ['reading-direction'], compose: ['OpenInNew', 'Launch', 'CallMade', 'CallReceived'], symbols: ['open_in_new', 'arrow_outward', 'call_made'],
      fluent: ['arrow_down_right'], fluentLegacy: ['arrow_up_right', 'arrow_up_left', 'arrow_down_left'], examples: ['external-link', 'arrow-up-end'] }),
  r('corner-arrows', 'Corner / hook arrows, sub-item arrows, enter-return', 'أسهم الزاوية وسهم الإدخال', 'auto',
    'Hooked arrows show a line turning into the next line or a child item; both depend on where lines start.', {
      principles: ['reading-direction'], compose: ['KeyboardReturn', 'KeyboardTab', 'Shortcut'], symbols: ['keyboard_return', 'keyboard_tab', 'arrow_split'], symbolsNot: ['subdirectory_arrow_right'],
      fluent: ['arrow_hook_down_left', 'arrow_hook_down_right', 'arrow_hook_up_left', 'arrow_hook_up_right'],
      disagreement: 'Material Symbols does not auto-mirror subdirectory_arrow_right although it mirrors keyboard_return. Material 1 guidance also says physical keyboards look the same everywhere, which argues for leaving key-cap glyphs alone.',
      recommendation: 'Mirror when the arrow shows flow in a layout (reply thread, sub-row, "press Enter to submit"). Do not mirror inside a depiction of a physical key cap.', examples: ['corner-down-end', 'enter'] }),
  r('backspace-delete-backward', 'Backspace / delete backward', 'مسح للخلف', 'auto',
    'The key removes the character before the caret; in RTL text that character is on the right, so the pointed side flips.', {
      principles: ['reading-direction'], compose: ['Backspace', 'KeyboardBackspace'], symbols: ['backspace', 'keyboard_backspace'], examples: ['backspace'] }),
  r('undo-redo', 'Undo / redo', 'تراجع وإعادة', 'auto',
    'Undo goes back in a linear history, redo goes forward; all three mechanical sources mirror them.', {
      principles: ['reading-direction'], compose: ['Undo', 'Redo'], symbols: ['undo', 'redo'], fluent: ['arrow_undo', 'arrow_redo'],
      md: ['conditional', 'Says these icons carry both a horizontal and a circular direction and that in RTL one has to choose which to show.'],
      disagreement: 'The Material guidance leaves the choice open (horizontal time mirrors, circular time does not); Material\'s own icons, Compose and Fluent all mirror.',
      recommendation: 'Mirror. Draw undo/redo as a hooked arrow whose horizontal reading dominates, not as a near-full circle, so it cannot be confused with rotate or refresh.', arabicSpecific: true, examples: ['undo', 'redo'] }),
  r('reply-forward-mail', 'Reply, reply all, forward (mail)', 'رد، رد على الكل، إعادة توجيه', 'auto',
    'Reply points back toward the sender (the start side), forward points onward.', {
      principles: ['reading-direction'], compose: ['Reply', 'ReplyAll', 'Forward', 'ForwardToInbox'], symbols: ['reply', 'reply_all', 'forward', 'forward_to_inbox'], fluent: ['arrow_reply', 'arrow_reply_all', 'arrow_forward'],
      arabicSpecific: true, examples: ['reply', 'reply-all', 'forward'] }),
  r('send', 'Send (paper plane)', 'إرسال', 'auto',
    'The plane flies forward, away from the composer: toward the left in RTL.', {
      principles: ['reading-direction'], compose: ['Send', 'ScheduleSend', 'SendAndArchive'], symbols: ['send', 'schedule_send', 'send_money'], fluent: ['send', 'send_clock'], hig: ['mirror', 'Forward-motion icons flip.'],
      arabicSpecific: true, examples: ['send'] }),
  r('login-logout-exit', 'Log in, log out, exit, enter', 'تسجيل الدخول والخروج', 'auto',
    'An arrow entering or leaving a door or frame moves along the reading direction.', {
      principles: ['reading-direction'], compose: ['Login', 'Logout', 'ExitToApp', 'Input'], symbols: ['login', 'logout', 'exit_to_app', 'input'], examples: ['log-in', 'log-out'] }),
  r('import-export-move', 'Import, export, move to (horizontal arrow with an object)', 'استيراد وتصدير ونقل', 'auto',
    'The arrow shows something travelling into or out of a container along the line.', {
      principles: ['reading-direction'], compose: ['DriveFileMove', 'AssignmentReturn'], symbols: ['drive_file_move', 'drive_export', 'move_item', 'move_location'],
      fluent: ['arrow_import', 'arrow_export', 'folder_arrow_right'], fluentUnique: ['arrow_export_ltr', 'arrow_export_rtl'], examples: ['import', 'export', 'move-to-folder'] }),
  r('swap-compare-horizontal', 'Swap / compare / transfer (two opposed horizontal arrows)', 'تبديل ومقارنة وتحويل', 'auto',
    'Which arrow is on top encodes an order; mirroring keeps "first goes forward".', {
      principles: ['reading-direction'], compose: ['CompareArrows'], symbols: ['compare_arrows'], symbolsNot: ['swap_horiz'], fluent: ['arrow_swap'],
      disagreement: 'Material Symbols mirrors compare_arrows but not the near-identical swap_horiz.', recommendation: 'Mirror; the flip is harmless when the glyph is point-symmetric.', examples: ['swap-horizontal', 'transfer'] }),
  r('text-lines', 'Lines of text: paragraph, notes, subject, wrap, segment', 'أسطر النص والفقرة', 'auto',
    'Ragged lines must start on the right, where Arabic lines start.', {
      principles: ['text-representation'], md: ['mirror'], hig: ['mirror'], compose: ['Notes', 'Subject', 'ShortText', 'WrapText', 'Segment', 'Toc'], symbols: ['notes', 'subject', 'short_text', 'wrap_text', 'segment', 'toc'],
      fluent: ['text_description'], fluentUnique: ['text_description_ltr', 'text_description_rtl'], examples: ['text', 'wrap-text'] }),
  r('text-alignment', 'Align text left / right', 'محاذاة النص لليمين واليسار', 'conditional',
    'The same two glyphs can mean "start/end" or physical "left/right", and the two readings need opposite treatment.', {
      principles: ['text-representation', 'absolute-direction'], compose: ['FormatAlignLeft', 'FormatAlignRight', 'AlignHorizontalLeft', 'AlignHorizontalRight'], symbols: ['format_align_left', 'format_align_right', 'horizontal_align_left'], symbolsNot: ['format_align_center', 'format_align_justify'],
      fluentLegacy: ['text_align_left', 'text_align_right'], hig: ['conditional', 'Icons representing text alignment flip; controls that mean a physical direction do not.'],
      disagreement: 'Material and Fluent auto-mirror the align-left and align-right icons, which silently turns "align left" into a right-aligned picture. That is right for a control that means align-start, and wrong for a rich-text toolbar whose button applies physical left alignment.',
      condition: 'Mirror when the control sets start/end alignment. Never mirror when it sets physical left/right alignment; in that case show the icon that matches the result.',
      recommendation: 'Ship four concepts: align-start and align-end (auto) and align-left and align-right (never). Editors use the physical pair and order the buttons right-to-left.', arabicSpecific: true, examples: ['align-start', 'align-end', 'align-left', 'align-right'] }),
  r('text-indent', 'Increase / decrease indent', 'زيادة وإنقاص المسافة البادئة', 'auto',
    'Indent moves the line start inward; the line start is on the right.', {
      principles: ['text-representation'], compose: ['FormatIndentIncrease', 'FormatIndentDecrease'], symbols: ['format_indent_increase', 'format_indent_decrease'], fluent: ['text_indent_increase', 'text_indent_decrease'],
      fluentUnique: ['text_indent_increase_rtl', 'text_indent_decrease_rtl'], arabicSpecific: true, examples: ['indent', 'outdent'] }),
  r('bulleted-list', 'Bulleted list, list view, table of contents', 'قائمة نقطية', 'auto',
    'Bullets sit at the start of each line.', {
      principles: ['text-representation'], compose: ['FormatListBulleted', 'List', 'ViewList', 'ListAlt'], symbols: ['format_list_bulleted', 'list', 'view_list', 'lists'],
      fluent: ['clipboard_bullet_list'], fluentUnique: ['text_bullet_list_ltr', 'text_bullet_list_rtl'], arabicSpecific: true, examples: ['list', 'list-bulleted'] }),
  r('checklist', 'Checklist / task list', 'قائمة مهام', 'conditional',
    'The rows flip (marks at the start) but each checkmark must keep its shape.', {
      principles: ['text-representation', 'universal-mark', 'composite'], compose: ['PlaylistAddCheck', 'FactCheck', 'Rule', 'Grading'], symbols: ['grading', 'list_alt'],
      fluentUnique: ['task_list', 'task_list_ltr', 'task_list_rtl', 'clipboard_task_list', 'multiselect'],
      disagreement: 'Material flips the whole drawable, checkmarks included. Fluent marks these icons "unique" and draws a separate RTL version in which the checkmark is not reversed.',
      condition: 'Needs RTL artwork: move the marks to the right, keep the checkmark unflipped.', recommendation: 'Follow Fluent: dedicated RTL artwork. A plain flip is an acceptable fallback only at sizes where the tick is a dot.', examples: ['list-checks'] }),
  r('numbered-list', 'Numbered list', 'قائمة مرقمة', 'conditional',
    'Numbers move to the right of the lines but digits are never flipped, and an Arabic interface may want ١ ٢ ٣.', {
      principles: ['numerals-letters', 'text-representation'], symbolsNot: ['format_list_numbered', 'format_list_numbered_rtl'], fluentUnique: ['text_number_list', 'text_number_list_ltr', 'text_number_list_rtl'],
      md: ['conditional', 'Icons containing numbers must be localized for locales that use other digits.'], hig: ['conditional', 'Reverse the order of numerals that show a sequence; never flip the numerals themselves.'],
      condition: 'Use separate RTL artwork with unflipped digits at the right. Choose Latin or Arabic-Indic digits from the locale\'s numbering system, not from direction.',
      recommendation: 'Three assets: list-numbered (LTR, 1 2 3), list-numbered-rtl (1 2 3 at the right), list-numbered-arab (١ ٢ ٣ at the right). Material ships format_list_numbered_rtl as its own symbol for the same reason; no catalog ships the Arabic-Indic variant (see gaps).', arabicSpecific: true, examples: ['list-numbered'] }),
  r('document-with-text', 'Document, note or receipt showing text lines', 'مستند أو إيصال يظهر أسطر نص', 'auto',
    'The lines inside the page are text lines and start on the right.', {
      principles: ['text-representation'], compose: ['Article', 'Assignment', 'ReceiptLong', 'TextSnippet', 'Feed', 'StickyNote2', 'Note', 'EventNote', 'LibraryBooks', 'MenuBook', 'ChromeReaderMode'],
      symbols: ['article', 'assignment', 'receipt_long', 'text_snippet', 'feed', 'sticky_note_2', 'event_note', 'menu_book', 'news'], fluent: ['clipboard_text', 'slide_text'], examples: ['file-text', 'receipt', 'invoice', 'book-open'] }),
  r('document-blank', 'Blank document with a folded corner', 'مستند فارغ بزاوية مطوية', 'conditional',
    'A blank page has no reading direction; only the folded corner makes it asymmetric.', {
      compose: ['InsertDriveFile', 'NoteAdd'], symbols: ['draft', 'docs', 'note_add'], fluentNot: ['document'],
      disagreement: 'Material mirrors the blank file (the fold moves to the top-left); Fluent does not mirror Document.',
      condition: 'No information is lost either way.', recommendation: 'Do not mirror the blank file; mirror only variants that add text lines or a horizontal arrow.', examples: ['file'] }),
  r('chat-bubbles', 'Chat, comment and message bubbles', 'فقاعات المحادثة والتعليق', 'auto',
    'The tail marks the speaker\'s side and any lines inside are text; own messages sit at the end side in RTL.', {
      principles: ['text-representation', 'reading-direction'], md: ['mirror', 'Chat icon given as the text-in-icon example.'], compose: ['Chat', 'Comment', 'Message', 'InsertComment', 'Announcement', 'SpeakerNotes'], symbols: ['chat', 'comment', 'speaker_notes', 'bubble'],
      fluent: ['comment', 'comment_add', 'comment_multiple', 'comment_text'], examples: ['message', 'comment'] }),
  r('volume-speaker', 'Speaker / volume', 'مكبر الصوت ومستوى الصوت', 'auto',
    'Sound waves travel forward from the speaker, and the icon usually sits at the start of a volume slider that itself mirrors.', {
      principles: ['reading-direction'], md: ['mirror', 'A volume icon with a slider is mirrored; waves emerge from the right.'], hig: ['mirror', 'Speaker with sound waves is the stated example of forward motion.'],
      compose: ['VolumeUp', 'VolumeDown', 'VolumeMute', 'VolumeOff'], symbols: ['volume_up', 'volume_down', 'volume_mute', 'volume_off', 'no_sound'], fluentNot: ['speaker_2'],
      disagreement: 'Fluent publishes no direction for its Speaker icons, so Fluent UIs do not flip them.', recommendation: 'Mirror the speaker and waves; keep the mute slash unflipped (see slash-overlay).', arabicSpecific: true, examples: ['volume', 'volume-off'] }),
  r('linear-progress', 'Progress bar, stepper, loading bar', 'شريط التقدم', 'auto',
    'Progress fills in the direction content is read: from the right in RTL.', {
      principles: ['reading-direction'], md: ['mirror', 'A progress bar shows 0% on the right and fills right to left.'], hig: ['mirror'],
      recommendation: 'An icon of a partly filled bar mirrors with the component. Exception: media progress (media-playback).', arabicSpecific: true, examples: ['progress'] }),
  r('slider', 'Slider and range icons', 'شريط التمرير', 'auto',
    'A slider goes from its minimum at the start to its maximum at the end; the glyphs at each end swap with it.', {
      principles: ['reading-direction'], hig: ['mirror', 'Flip sliders and swap the images that mark the minimum and maximum.'],
      recommendation: 'A "sliders/tune" settings icon (several tracks with knobs) is abstract and may stay; an icon that shows one track with a filled part mirrors.', arabicSpecific: true, examples: ['slider'] }),
  r('rating-half', 'Half star / partial rating', 'نصف نجمة', 'auto',
    'A rating fills from the start side, so the filled half is on the right in RTL.', {
      principles: ['reading-direction'], compose: ['StarHalf'], symbols: ['star_half'], hig: ['mirror', 'Rating controls are listed with progress bars and sliders.'], examples: ['star-half'] }),
  r('sort-lines', 'Sort (bars of decreasing length), sort ascending / descending with bars', 'فرز (أشرطة متدرجة الطول)', 'auto',
    'The bars are stylised lines of text aligned to the start; the vertical arrow, if any, does not change.', {
      principles: ['text-representation'], compose: ['Sort'], symbols: ['sort'], symbolsNot: ['filter_list'],
      recommendation: 'Mirror start-aligned bars. Centred bars (filter-list) are symmetric and unaffected.', arabicSpecific: true, examples: ['sort', 'sort-ascending', 'sort-descending'] }),
  r('sidebar-panel', 'Sidebar, side panel, drawer open/close, split view', 'الشريط الجانبي واللوحة الجانبية', 'auto',
    'The icon is a miniature of the layout, and the layout itself mirrors: the navigation panel is on the right in RTL.', {
      principles: ['composite'], compose: ['ViewSidebar', 'MenuOpen', 'ViewQuilt', 'BrandingWatermark'], symbols: ['view_sidebar', 'menu_open', 'side_navigation', 'arrow_menu_open', 'arrow_menu_close', 'picture_in_picture'],
      fluent: ['panel_left_text', 'panel_left_header', 'panel_right_gallery'], hig: ['mirror', 'A part that depicts actual UI flips when the UI flips.'],
      recommendation: 'Name by logical side (panel-start, panel-end) and mirror. A control that docks to a physical side keeps physical names and is never mirrored.', examples: ['panel-start', 'panel-end'] }),
  r('label-pointer', 'Label / "important" marker (pentagon pointing to the end)', 'ملصق مدبب', 'auto',
    'The point works like an arrow head toward the labelled text.', {
      compose: ['Label', 'LabelImportant', 'LabelOff'], symbols: ['label', 'label_important'], fluentNot: ['tag'],
      disagreement: 'Material mirrors its pointed label. Fluent\'s Tag (a hanging price tag, i.e. an object) has no direction.', recommendation: 'Mirror the pointed label shape; treat a price tag with a hole and string as an object and leave it.', examples: ['label'] }),
  r('flag', 'Flag on a pole', 'علم', 'auto',
    'The pole stands at the start and the cloth flies toward the end.', {
      symbols: ['flag', 'emoji_flags'], fluentNot: ['flag'],
      disagreement: 'Material Symbols mirrors flag; the older Compose list does not include Flag; Fluent has no direction for it.',
      recommendation: 'Mirror the generic flag marker. Never mirror a depiction of a real national flag.', examples: ['flag'] }),
  r('moving-things', 'People and vehicles in motion: walk, run, bike, delivery truck', 'أشخاص ومركبات في حركة', 'auto',
    'Something moving forward faces the reading direction.', {
      principles: ['reading-direction'], md: ['mirror', 'A bicycle or a walking person faces left in RTL.'], hig: ['mirror'], compose: ['DirectionsWalk', 'DirectionsRun', 'DirectionsBike'], symbols: ['directions_walk', 'directions_run', 'pedal_bike', 'local_shipping', 'airport_shuttle', 'flight_takeoff'],
      fluentUnique: ['vehicle_car_profile_ltr', 'vehicle_car_profile_rtl'], recommendation: 'Mirror side-view vehicles used for delivery and shipping status. Front-view vehicles are symmetric.', examples: ['truck', 'delivery'] }),
  r('trend-arrows', 'Trending up / down, growth arrow', 'اتجاه صاعد وهابط', 'conditional',
    'A trend line is a tiny time-series chart, and sources disagree on whether time in charts runs right to left.', {
      principles: ['reading-direction'], compose: ['TrendingUp', 'TrendingDown', 'TrendingFlat', 'ShowChart', 'MultilineChart'], symbols: ['trending_up', 'trending_down', 'show_chart', 'monitoring', 'moving'], symbolsNot: ['stacked_line_chart', 'timeline'],
      fluent: ['arrow_trending', 'arrow_trending_down', 'arrow_trending_lines'], md: ['never', 'Lists charts and graphs among the things that are not mirrored.'],
      disagreement: 'The Material guidance says charts and graphs are not mirrored, yet Material\'s icons auto-mirror trending_up, show_chart and monitoring, and Fluent mirrors Arrow Trending. Material Symbols is not even consistent with itself: stacked_line_chart and timeline are not mirrored.',
      condition: 'Follow the direction of the charts in the same product. If its time axis runs right to left in Arabic, mirror; if charts stay left-to-right (common for financial data), do not.',
      recommendation: 'Default to mirroring the bare trend arrow used as a KPI delta, because "up and forward" then reads forward; keep chart-type icons (line, bar, area) tied to the chart component\'s axis-direction setting, default not mirrored.', arabicSpecific: true, examples: ['trending-up', 'trending-down', 'chart-line'] }),
  r('breadcrumb-tree-connectors', 'Breadcrumb separators, tree and thread connectors, step arrows', 'فواصل مسار التنقل وروابط الشجرة', 'auto',
    'They draw the order of items along the line.', { principles: ['reading-direction'], fluent: ['arrow_step_over', 'arrow_flow_up_right'], compose: ['ReadMore', 'NextPlan'], symbols: ['read_more', 'next_plan'], examples: ['breadcrumb-separator'] }),

  // ── never ─────────────────────────────────────────────────────────────────────────────────────────────────
  r('search-magnifier', 'Search magnifier', 'عدسة البحث', 'never',
    'The handle at the lower right is how a right-handed person holds the glass, not a direction.', {
      principles: ['right-hand'], md: ['never', 'Search is the stated right-hand example.'], hig: ['never', 'Names the magnifying glass as a component that stays consistent.'], symbolsNot: ['search'], fluentNot: ['search'],
      compose: ['ManageSearch'], symbols: ['manage_search'],
      disagreement: 'None on the plain magnifier. Composite icons that add text lines (manage_search) are mirrored by Material as a whole, which flips the glass too.',
      recommendation: 'Never mirror the magnifier. In composites, flip only the text-line part.', arabicSpecific: true, examples: ['search'] }),
  r('clock-time', 'Clock, time, history, timer', 'الساعة والوقت والسجل', 'never',
    'Clocks turn clockwise everywhere.', { principles: ['circular-time'], md: ['never'], hig: ['never'], symbolsNot: ['schedule', 'history'], fluentNot: ['clock', 'history'], examples: ['clock', 'history'] }),
  r('refresh-sync-rotate', 'Refresh, sync, reload, rotate, repeat (circular arrows)', 'تحديث ومزامنة وتدوير', 'never',
    'A circular arrow shows clockwise or counter-clockwise turning, which is the same in every script.', {
      principles: ['circular-time'], md: ['never', 'Refresh and history arrows are the stated examples.'], symbolsNot: ['refresh', 'sync', 'autorenew', 'cached', 'replay', 'restart_alt'],
      compose: ['RotateLeft', 'RotateRight'], symbols: ['rotate_left', 'rotate_right'], fluent: ['arrow_sync', 'arrow_rotate_clockwise', 'arrow_rotate_counterclockwise', 'arrow_repeat_all', 'arrow_reset'], fluentNot: ['arrow_clockwise', 'arrow_counterclockwise'],
      disagreement: 'Material does not mirror refresh/sync but does mirror rotate_left and rotate_right. Fluent marks Arrow Sync, Arrow Rotate Clockwise/Counterclockwise, Arrow Repeat All and Arrow Reset as "mirror", while its plain Arrow Clockwise has no direction. Mirroring a rotate icon makes it show the opposite rotation from the one it performs.',
      recommendation: 'Never mirror: follow the Material and Apple principle against the two icon sets. Rotating an image 90° clockwise is the same act in Arabic.', examples: ['refresh', 'sync', 'rotate-cw', 'rotate-ccw'] }),
  r('spinner', 'Spinner / circular progress', 'مؤشر التحميل الدائري', 'never', 'Circular progress runs clockwise.', { principles: ['circular-time'], md: ['never'], symbolsNot: ['progress_activity'], examples: ['spinner'] }),
  r('media-playback', 'Media playback: play, pause, skip, fast-forward, rewind, media progress', 'عناصر تشغيل الوسائط', 'never',
    'They show the direction of the tape, not of reading.', {
      principles: ['media-direction'], md: ['never'], symbolsNot: ['play_arrow', 'pause', 'skip_next', 'skip_previous', 'fast_forward', 'fast_rewind', 'forward_10'], fluentNot: ['play'],
      recommendation: 'Never mirror. Do not reuse the play triangle as a generic "next" or "expand" chevron: that meaning mirrors, this one does not.', examples: ['play', 'pause', 'skip-forward', 'skip-back'] }),
  r('checkmark', 'Checkmark / done', 'علامة الصح', 'never', 'A universal mark with one shape.', { principles: ['universal-mark'], hig: ['never'], symbolsNot: ['check', 'done'], fluentNot: ['checkmark'], examples: ['check', 'check-circle'] }),
  r('slash-overlay', 'Slash through an icon (off / disabled / not allowed)', 'الشرطة المائلة (إيقاف أو تعطيل)', 'never',
    'The negating slash has the same slant in both directions.', {
      principles: ['slash-stays', 'composite'], md: ['never', 'Most RTL countries do not mirror slashes.'], hig: ['never', 'SF Symbols keeps the same slash in LTR and RTL.'],
      compose: ['VolumeOff', 'LabelOff'], symbols: ['volume_off'],
      disagreement: 'Whole-drawable mirroring (Android autoMirrored, CSS scaleX(-1)) flips the slash together with the base, so Material\'s own volume_off contradicts the Material guidance in RTL.',
      recommendation: 'Build "off" variants as base + slash layers so the base can mirror while the slash stays; otherwise ship RTL artwork.', examples: ['eye-off', 'bell-off', 'volume-off'] }),
  r('physical-objects', 'Real-world objects: camera, keyboard, headset, printer, lock, key, calculator, building', 'أشياء من الواقع: كاميرا، لوحة مفاتيح، طابعة، قفل', 'never',
    'The object looks the same everywhere.', { principles: ['physical-object'], md: ['never'], hig: ['never'], symbolsNot: ['photo_camera', 'keyboard', 'headphones', 'print', 'lock'], examples: ['camera', 'printer', 'lock'] }),
  r('right-hand-tools', 'Tools held in the right hand: pencil, pen, brush, cup', 'أدوات تُمسك باليد اليمنى: قلم، فرشاة، كوب', 'never',
    'The slant shows a right hand holding the tool.', {
      principles: ['right-hand'], md: ['never'], hig: ['never'], symbolsNot: ['edit', 'draw'], fluentNot: ['edit'],
      recommendation: 'Never mirror the tool. If the icon also has a text line or a page, flip that part only.', examples: ['edit', 'pencil'] }),
  r('phone-handset', 'Phone handset; call with direction arrows', 'سماعة الهاتف والمكالمات', 'conditional',
    'The handset is an object and stays; an arrow added for incoming, outgoing, missed or forwarded follows reading direction.', {
      principles: ['physical-object', 'composite', 'reading-direction'], symbolsNot: ['call', 'phone_enabled'], fluentNot: ['call', 'phone'],
      compose: ['PhoneForwarded', 'PhoneCallback', 'PhoneMissed', 'CallMissed', 'CallMissedOutgoing'], symbols: ['phone_forwarded', 'phone_callback', 'phone_missed'],
      disagreement: 'Material mirrors the whole composite including the handset; Apple\'s guidance is to keep the object and flip only the directional part.',
      condition: 'Plain handset: never. Handset plus arrow: the arrow mirrors, the handset does not.', recommendation: 'Draw call-direction icons as two layers, or accept the Material behaviour (whole flip) as the fallback.', arabicSpecific: true, examples: ['phone', 'phone-incoming', 'phone-outgoing', 'phone-missed'] }),
  r('logos-brands', 'Logos, brand marks, payment scheme marks, national symbols', 'الشعارات والعلامات التجارية', 'never', 'A flipped logo is a different mark and may be unlawful.', { principles: ['universal-mark'], hig: ['never'], examples: ['brand'] }),
  r('absolute-direction-arrows', 'Arrows that mean a physical direction: move left/right, arrow keys, turn right, dock to side', 'أسهم الاتجاه الفعلي: يمين ويسار', 'never',
    '"Right" is right in every language: map turns, canvas nudges, keyboard arrows and column pinning to a physical side.', {
      principles: ['absolute-direction'], hig: ['never'], symbolsNot: ['turn_right', 'turn_left', 'navigation', 'near_me', 'swipe_left'],
      compose: ['AssistantDirection', 'AltRoute'], symbols: ['directions', 'alt_route'],
      disagreement: 'Material mirrors some map/route signs (directions, alt_route) while leaving turn_left/turn_right alone.',
      recommendation: 'The glyph is the same as in back-forward-navigation; the difference is meaning. The icon API must therefore make the choice explicit (logical vs physical name), not infer it from the drawing.', examples: ['arrow-left', 'arrow-right', 'chevron-left', 'chevron-right'] }),
  r('text-direction-controls', 'Text direction controls (LTR / RTL paragraph direction)', 'أزرار اتجاه النص', 'never',
    'Each icon names one fixed direction; flipping it would make the RTL button show the LTR picture.', {
      principles: ['absolute-direction'], compose: ['FormatTextdirectionLToR', 'FormatTextdirectionRToL'], symbolsNot: ['format_textdirection_l_to_r', 'format_textdirection_r_to_l'], fluentUnique: ['text_direction_horizontal_ltr', 'text_direction_horizontal_rtl'],
      disagreement: 'Compose lists both text-direction icons as auto-mirrored; Material Symbols does not mirror them; Fluent ships them as two fixed assets.',
      recommendation: 'Never mirror; pick the asset by meaning.', arabicSpecific: true, examples: ['text-direction-ltr', 'text-direction-rtl'] }),
  r('vertical-and-symmetric', 'Vertical arrows and symmetric glyphs: up/down chevrons, upload/download, plus, minus, close, menu, more, home, eye, funnel', 'الأسهم الرأسية والأشكال المتماثلة', 'never',
    'A horizontal flip changes nothing or only shifts optical details.', {
      symbolsNot: ['expand_more', 'keyboard_arrow_down', 'arrow_upward', 'close', 'menu', 'add', 'download', 'upload', 'home', 'visibility', 'filter_alt'], fluent: ['arrow_up'],
      disagreement: 'Fluent marks Arrow Up as "mirror", which has no visible effect on a symmetric arrow.', recommendation: 'Mark as never so no transform is applied (it keeps pixel-snapped strokes crisp).', examples: ['chevron-down', 'chevron-up', 'plus', 'close', 'menu', 'download', 'upload'] }),
  r('share-link-attach', 'Share (connected nodes), link, paperclip', 'مشاركة، رابط، مشبك ورق', 'never', 'Abstract or physical marks without a reading direction.', { principles: ['physical-object'], symbolsNot: ['share', 'link', 'attach_file'], fluentNot: ['share'], examples: ['share', 'link', 'paperclip'] }),
  r('copy-duplicate', 'Copy / duplicate (two stacked sheets)', 'نسخ وتكرار', 'never',
    'Stacked sheets carry no direction.', {
      symbols: ['content_copy'], fluentNot: ['copy'],
      disagreement: 'Material Symbols currently marks content_copy as auto-mirrored (the older Compose list does not include ContentCopy); Fluent does not mirror Copy.',
      recommendation: 'Do not mirror. If a product wants the back sheet to peek out at the end side, that is a drawing decision, not a rule.', examples: ['copy'] }),
  r('cart-bag', 'Shopping cart, basket, bag', 'عربة التسوق والسلة', 'never',
    'Treated as an object by every mechanical source.', {
      principles: ['physical-object'], symbolsNot: ['shopping_cart'], fluentNot: ['cart'], hig: ['conditional', 'Uses a cart with a badge as the example for judging badge position separately.'],
      recommendation: 'Do not mirror the cart. Position a count badge at the top end corner in both directions.', examples: ['cart', 'bag'] }),
  r('codes-barcode-qr', 'Barcode, QR code, scan frames', 'الباركود ورمز الاستجابة السريعة', 'never',
    'A mirrored code is a different (invalid) code; the finder patterns of a QR code have a fixed arrangement.', { principles: ['physical-object'], symbolsNot: ['qr_code', 'barcode'], basis: 'authored', examples: ['barcode', 'qr-code'] }),
  r('code-and-terminal', 'Code brackets, terminal prompt', 'أقواس الشيفرة وموجّه الطرفية', 'never', 'Source code and shells are left-to-right in every locale.', { symbolsNot: ['code', 'terminal'], basis: 'authored', examples: ['code', 'terminal'] }),
  r('currency-signs', 'Currency signs and money', 'رموز العملات والنقود', 'never',
    'A currency sign is a character; flipping it produces a wrong glyph.', {
      principles: ['numerals-letters'], symbolsNot: ['attach_money'], symbols: ['send_money'],
      recommendation: 'Never mirror the sign. Composite "send money" style icons mirror only their arrow.', arabicSpecific: true, examples: ['currency', 'banknote', 'coins'] }),
  r('hands-gestures', 'Hands and gestures: thumbs up, pointing hand', 'الأيدي والإيماءات', 'never', 'Hands are drawn as right hands; same reasoning as right-hand tools.', { principles: ['right-hand'], symbolsNot: ['thumb_up'], examples: ['thumbs-up'] }),
  r('pie-and-bar-charts', 'Pie, donut and bar chart icons', 'مخططات دائرية وعمودية', 'never',
    'Circular charts have no reading direction, and the guidance excludes charts from mirroring.', {
      principles: ['circular-time'], md: ['never', 'Charts and graphs are listed as not mirrored.'], symbolsNot: ['pie_chart', 'bar_chart'],
      recommendation: 'Never mirror the icon. Whether the real chart component reverses its category axis in RTL is a chart setting, not an icon rule.', arabicSpecific: true, examples: ['chart-pie', 'chart-bar'] }),

  r('non-directional', 'Everything else: icons with no horizontal direction, text, sequence or handedness', 'بقية الأيقونات التي لا تحمل اتجاهاً', 'never',
    'An icon that does not communicate direction is left unchanged. This is the default for any concept without a more specific rule.', {
      principles: ['physical-object'], md: ['never', 'Icons that do not communicate direction are not changed.'], symbolsNot: ['settings', 'delete', 'notifications', 'mail', 'person', 'star', 'bookmark'], examples: ['settings', 'trash', 'bell', 'mail', 'user'] }),

  // ── conditional ───────────────────────────────────────────────────────────────────────────────────────────
  r('question-mark', 'Question mark / help', 'علامة الاستفهام والمساعدة', 'conditional',
    'The Arabic question mark «؟» (U+061F) is the mirror image of «?». That is a property of the script, not of direction: Persian and Urdu share it, Hebrew writes «?».', {
      principles: ['numerals-letters'], compose: ['Help', 'HelpOutline', 'HelpCenter', 'LiveHelp', 'ContactSupport', 'NotListedLocation', 'BatteryUnknown'], symbols: ['help', 'help_center', 'live_help', 'contact_support', 'shield_question'],
      fluentUnique: ['book_question_mark_rtl'], fluentNot: ['question', 'question_circle'],
      disagreement: 'Android auto-mirrors help icons in every RTL locale, which also reverses the mark for Hebrew. Fluent leaves its Question icons unmirrored in every locale and ships one hand-drawn RTL variant (Book Question Mark RTL).',
      condition: 'Mirror when the interface language is written in Arabic script (ar, fa, ur, ckb, ps, …). Do not mirror for Hebrew or for an LTR language shown in an RTL container.',
      recommendation: 'Drive this rule from the locale\'s script, not from dir. Ship help and help-arab as two glyphs, or mirror by script at render time.', arabicSpecific: true, examples: ['help', 'help-circle'] }),
  r('letters-in-icons', 'Icons that contain letters: font size, bold/italic/underline, text colour, translate, spell-check', 'أيقونات تحتوي على حروف', 'conditional',
    'Letters are never flipped. For an Arabic-first product a Latin «A» is the wrong letter, not the wrong direction.', {
      principles: ['numerals-letters'], hig: ['conditional', 'Recommends a localized version of icons that display text; SF Symbols ships Arabic and Hebrew variants.'], symbolsNot: ['format_bold', 'format_italic', 'translate'],
      condition: 'Never mirror. Swap to an Arabic-letter drawing («أ» or «ع») when the interface language is Arabic.',
      recommendation: 'Provide -arab variants for the text-formatting group; none of the nine catalogs has them (see gaps). Arabic has no italic tradition: keep a slanted stroke icon without a letter for "italic".', arabicSpecific: true, examples: ['text-size', 'bold', 'italic', 'underline', 'translate'] }),
  r('sort-alphabetical', 'Sort A→Z / Z→A', 'فرز أبجدي (أ ← ي)', 'conditional',
    'The letters must be localized (أ and ي); the vertical arrow is unaffected and the letters keep their own shape.', {
      principles: ['numerals-letters'], symbolsNot: ['sort_by_alpha'],
      condition: 'Never mirror. Use the Arabic-letter variant for Arabic; if letters sit beside the arrow, put them on the start side.',
      recommendation: 'Prefer a letter-free sort icon in components (sort-ascending / sort-descending with bars); offer sort-alpha and sort-alpha-arab for explicit alphabetical sort.', arabicSpecific: true, examples: ['sort-alpha-asc', 'sort-alpha-desc'] }),
  r('digits-in-icons', 'Icons that contain digits: calendar date, counters, "10 seconds" skips, 123 keyboards', 'أيقونات تحتوي على أرقام', 'conditional',
    'Digits are never mirrored and never reordered inside one number; which digit shapes to draw follows the numbering system.', {
      principles: ['numerals-letters'], md: ['conditional', 'Icons containing numbers must be localized where other digits are used.'], hig: ['conditional', 'Do not reverse digits within a number.'], symbolsNot: ['forward_10'],
      condition: 'Never mirror. Use Arabic-Indic digits only when the product\'s numbering system for the locale is arab; many Arabic interfaces (Maghreb, and by choice in the Gulf) use Latin digits.',
      recommendation: 'Avoid baked-in digits in the core set; render the number as live text over a blank icon so it follows the numerals setting.', arabicSpecific: true, examples: ['calendar-date', 'badge-count'] }),
  r('quote-marks', 'Quotation marks / blockquote', 'علامات التنصيص والاقتباس', 'conditional',
    'Arabic typography uses «…» or the same curly pair as English, with the opening mark on the right. No mechanical source mirrors its quote icon.', {
      symbolsNot: ['format_quote'], fluentNot: ['text_quote'], basis: 'authored',
      condition: 'A blockquote icon made of a vertical bar plus text lines mirrors (text-lines). A pair of quote glyphs is a character: do not flip the glyph shape; choose opening or closing marks so that the opening one is at the start.',
      recommendation: 'Use a bar-and-lines blockquote icon in the editor toolbar; if quote glyphs are wanted, ship an Arabic variant with «» rather than mirroring 66/99 marks.', arabicSpecific: true, examples: ['quote', 'blockquote'] }),
  r('calendar', 'Calendar', 'التقويم', 'conditional',
    'A plain calendar page is symmetric. It becomes directional when it shows text lines, an arrow, or a highlighted day cell.', {
      symbolsNot: ['calendar_month', 'calendar_today', 'event'], compose: ['EventNote', 'NextWeek'], symbols: ['event_note', 'event_upcoming', 'next_week'], fluent: ['calendar', 'calendar_link'], fluentUnique: ['calendar_ltr', 'calendar_rtl'],
      md: ['conditional', 'Says the days of a calendar run right to left (about the grid, not the icon).'],
      disagreement: 'Fluent marks Calendar "mirror" and also ships Calendar LTR / Calendar RTL assets. Material does not mirror calendar_month, calendar_today or event, only the variants with lines or arrows.',
      condition: 'Mirror only when the drawing marks a specific cell, lines or an arrow.', recommendation: 'Draw the core calendar icon symmetric (header bar, two rings, no marked cell) and declare it never; variants with an arrow inherit the arrow rule.', arabicSpecific: true, examples: ['calendar', 'calendar-range'] }),
  r('toggle-switch', 'Toggle / switch pictograms', 'مفتاح التبديل', 'conditional',
    'The "on" position is at the end of the track; the switch component mirrors, and an icon of it should agree with the component next to it.', {
      symbolsNot: ['toggle_on'], basis: 'authored', principles: ['reading-direction'],
      condition: 'Mirror if the icon stands for the state of a switch that itself mirrors. Icons named by physical side (toggle-left, toggle-right) are never mirrored.', recommendation: 'Name by state (toggle-on, toggle-off) and mirror.', examples: ['toggle-on', 'toggle-off'] }),
  r('badged-icons', 'Icons with a corner badge (count, plus, status dot)', 'أيقونات بشارة في الزاوية', 'conditional',
    'The badge is a separate part: it may need to move to the other corner while the base stays, or the reverse.', {
      principles: ['composite'], hig: ['conditional'], condition: 'Decide base and badge separately. A badge that mimics real UI (a notification dot) goes to the top end corner.',
      recommendation: 'Compose badges at render time instead of baking them into the icon.', examples: ['bell-dot', 'cart-badge', 'user-plus'] }),
  r('signature-handwriting', 'Signature, handwriting, text cursor', 'التوقيع والكتابة باليد', 'conditional',
    'A scribble that imitates Latin handwriting reads as foreign in Arabic; the pen itself is a right-hand tool.', {
      principles: ['numerals-letters', 'right-hand'], hig: ['conditional', 'SF Symbols provides localized signature and I-beam symbols.'], symbolsNot: ['signature'],
      condition: 'Never mirror the pen. Use a script-neutral stroke or an Arabic-style signature drawing.', recommendation: 'Draw the signature as a neutral wave on a baseline with the X mark at the start side; that variant mirrors as text-lines.', examples: ['signature'] }),
  r('percent-sign', 'Percent and discount', 'النسبة المئوية والخصم', 'conditional',
    'The Arabic percent sign «٪» (U+066A) is a different glyph, not a mirror image, and the slash keeps its slant.', {
      principles: ['numerals-letters', 'slash-stays'], symbolsNot: ['percent'], basis: 'authored',
      condition: 'Never mirror. Use «٪» only together with Arabic-Indic digits.', recommendation: 'Keep one percent icon (%) in the core set and let live text carry the localized sign.', arabicSpecific: true, examples: ['percent', 'discount'] }),
]
