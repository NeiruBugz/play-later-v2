# Accessibility Testing Guide: Library Feature

Quick reference for manually testing accessibility improvements.

---

## 🎹 Keyboard Navigation Testing (5 minutes)

### Library Page Navigation Flow

1. **Start at Library Page** (`/library`)
   - Press `Tab` - Should focus first filter (Status dropdown)
   - Press `Tab` - Should focus Platform dropdown
   - Press `Tab` - Should focus Search input
   - Press `Tab` (if filters active) - Should focus "Clear Filters" button
   - Press `Tab` - Should focus Sort dropdown
   - Press `Tab` - Should focus first game card

2. **Filter Interaction**
   - Focus Status dropdown, press `Enter` or `Space` - Should open dropdown
   - Press `Arrow Down/Up` - Should navigate options
   - Press `Enter` - Should select option and close dropdown
   - Verify: URL updates with filter parameter

3. **Game Card Interaction**
   - `Tab` to a game card
   - Press `Enter` - Should navigate to game detail page
   - `Shift+Tab` back to card, `Tab` into card - Should focus action bar buttons (Variant B) or badge popover (Variant A)

4. **Action Bar (Variant B)**
   - `Tab` to game card
   - `Tab` again - Should reveal action bar and focus first status button
   - Press `Enter` - Should change status
   - Verify: Toast notification appears

5. **Modal Navigation**
   - Navigate to game detail page
   - Focus "Add to Library" or "Manage Library" button
   - Press `Enter` - Modal opens
   - `Tab` - Should cycle through form fields within modal (focus trapped)
   - Press `Escape` - Modal closes, focus returns to trigger button

### Expected Results
- ✅ All interactive elements reachable with `Tab`
- ✅ No "keyboard trap" (can always Tab away)
- ✅ Focus indicators visible on all elements
- ✅ `Enter`/`Space` activates buttons and links
- ✅ `Escape` closes modals and popovers
- ✅ Arrow keys navigate dropdowns and comboboxes

---

## 🔊 Screen Reader Testing (10 minutes)

### Setup
- **macOS**: VoiceOver - Press `Cmd+F5`
- **Windows**: NVDA - Download from nvaccess.org
- **Chrome Extension**: ChromeVox

### Key VoiceOver Commands (macOS)
- `VO` = `Control+Option`
- `VO+A` - Start reading
- `VO+Right Arrow` - Next element
- `VO+Space` - Activate element
- `Cmd+F5` - Toggle VoiceOver off

### Test Script

1. **Library Grid Announcement**
   - Navigate to library page
   - Listen for: "Your game library, feed" or similar
   - `VO+Right Arrow` through cards
   - Listen for: "[Game Title] - [Status] - [Entry count if multiple], link"

2. **Filter Announcements**
   - Focus Status filter
   - Listen for: "Status, button" or "Filter by status"
   - Open dropdown, navigate options
   - Listen for: Each status announced (Wishlist, Curious About, etc.)

3. **Badge Announcements**
   - Focus a game card
   - Listen for full card info including:
     - Game title
     - "Status: [Status Name]"
     - "[X] library entries for this game" (if multiple)

4. **Action Bar Announcements**
   - Focus game card action buttons
   - Listen for: "Change status to [Status Name], button"
   - For disabled options: "[Status] - Cannot move back to Wishlist"

5. **Modal Announcements**
   - Open library modal
   - Listen for: Modal title, then description
   - Navigate form fields
   - Listen for: Each label and current value

### Expected Results
- ✅ All interactive elements announced
- ✅ Status and context provided (not just "button")
- ✅ Disabled elements announce why they're disabled
- ✅ Form fields have associated labels
- ✅ No duplicate announcements

---

## 📱 Responsive Design Testing (5 minutes)

### Browser DevTools Method

1. **Open DevTools** - `Cmd+Option+I` (Mac) or `F12` (Windows)
2. **Toggle Device Toolbar** - `Cmd+Shift+M` (Mac) or `Ctrl+Shift+M` (Windows)
3. **Test These Widths**:

| Width | Device | Expected Layout |
|-------|--------|----------------|
| 375px | iPhone SE | 2 columns, stacked filters, full-width Clear button |
| 414px | iPhone 12/13 | 2 columns, stacked filters |
| 640px | Small Tablet | 3 columns, stacked filters |
| 768px | iPad | 4 columns, inline filters |
| 1024px | Desktop | 5 columns, inline filters |
| 1280px+ | Large Desktop | 6 columns, inline filters |

### Check These Elements

- **Library Grid**: Columns change at breakpoints (2 → 3 → 4 → 5 → 6)
- **Filters**: Stack vertically on mobile, inline on desktop
- **Clear Filters Button**: Full-width on mobile, auto-width on desktop
- **Game Cards**: Maintain 3:4 aspect ratio, no squishing
- **Action Bar**: Buttons wrap if needed, don't overflow card
- **Modal**: Full-width on mobile, max 600px on desktop

### Expected Results
- ✅ No horizontal scrolling on any width
- ✅ All text readable (not too small)
- ✅ Buttons tappable (at least 44x44px)
- ✅ Layout looks intentional at all widths

---

## 🎨 Color Contrast Testing (5 minutes)

### Browser DevTools Method

1. **Open DevTools** - `Cmd+Option+I` (Mac) or `F12` (Windows)
2. **Elements Tab** - Click element to inspect
3. **Styles Panel** - Look for color values
4. **Color Picker** - Click color swatch
5. **Contrast Ratio** - Shows in color picker (e.g., "15.1" with ✅ or ❌)

### Elements to Check

| Element | Expected Ratio | WCAG Level |
|---------|---------------|------------|
| Body text | ≥ 4.5:1 | AA (normal text) |
| Muted text | ≥ 4.5:1 | AA (normal text) |
| Status badges | ≥ 4.5:1 | AA (normal text) |
| Action bar buttons | ≥ 4.5:1 | AA (normal text) |
| Focus indicators | ≥ 3:1 | AA (UI components) |

### Manual Contrast Check (if DevTools unavailable)

1. **Take Screenshot** of element
2. **Upload to WebAIM**: https://webaim.org/resources/contrastchecker/
3. **Enter Colors**: Foreground and background hex values
4. **Check Result**: Pass = ✅, Fail = ❌

### Expected Results
- ✅ All text passes 4.5:1 minimum
- ✅ Large text (18pt+) passes 3:1 minimum
- ✅ UI components (borders, focus rings) pass 3:1

---

## 🖱️ Touch Target Testing (Mobile Only)

### Use Actual Device or Emulator

1. **Open on Mobile Device** or Chrome DevTools responsive mode
2. **Enable Touch Emulation** (in DevTools)
3. **Try to Tap These**:
   - Game cards (entire card is clickable)
   - Filter dropdowns
   - Action bar buttons
   - Status badges
   - Clear Filters button

### Measurement
- Use browser's "Inspect Element" to check width/height
- Touch targets should be at least **44x44 pixels**

### Expected Results
- ✅ Game cards: Full card is tappable (no accidental clicks)
- ✅ Action bar buttons: Each button ≥ 44x44px
- ✅ Dropdowns: Trigger buttons ≥ 44x44px
- ✅ No frustration tapping small targets

---

## 🚀 Quick Automated Test (1 minute)

### Chrome Lighthouse Audit

1. **Open DevTools** - `Cmd+Option+I` (Mac) or `F12` (Windows)
2. **Lighthouse Tab** - (may need to click `>>` to find it)
3. **Select**:
   - ✅ Accessibility
   - Device: Desktop or Mobile
4. **Generate Report**

### Expected Score
- **Target**: ≥ 90/100 (green)
- **Acceptable**: ≥ 80/100 (orange)
- **Review**: < 80/100 (red - check issues)

### Common Issues Caught
- Missing alt text on images
- Low color contrast
- Missing form labels
- Missing ARIA attributes
- Links without discernible names

---

## ✅ Quick Checklist (Before Deployment)

Use this checklist to verify all accessibility improvements:

### Keyboard Navigation
- [ ] Can Tab to all interactive elements
- [ ] Enter/Space activates buttons and links
- [ ] Arrow keys work in dropdowns
- [ ] Escape closes modals/popovers
- [ ] Focus visible on all elements
- [ ] No keyboard traps

### Screen Reader
- [ ] Game titles announced
- [ ] Status badges have context
- [ ] Disabled items explain why
- [ ] Form fields have labels
- [ ] Modal title/description announced

### Responsive Design
- [ ] Grid adapts: 2 → 3 → 4 → 5 → 6 columns
- [ ] Filters stack on mobile, inline on desktop
- [ ] Modal scrolls when tall
- [ ] No horizontal scrolling
- [ ] Touch targets ≥ 44x44px

### Color Contrast
- [ ] Body text ≥ 4.5:1
- [ ] Muted text ≥ 4.5:1
- [ ] Badges/buttons ≥ 4.5:1
- [ ] Focus indicators ≥ 3:1

### Lighthouse
- [ ] Accessibility score ≥ 90

---

## 🐛 Troubleshooting

### "I can't Tab to action bar buttons"
- **Solution**: The action bar reveals on card focus. Tab to the game card first, then Tab again into the action bar.
- **Alternative**: Try the interactive badge variant instead (Variant A).

### "Screen reader announces too much"
- **Expected**: The card link has a comprehensive aria-label (title + status + count).
- **Why**: Provides full context in one announcement instead of multiple.

### "Filters don't stack on mobile"
- **Check**: Browser width < 768px? Try narrower (e.g., 375px).
- **Cache**: Hard refresh (`Cmd+Shift+R`) to clear cached styles.

### "Focus indicator not visible"
- **Dark Mode**: Check both light and dark modes.
- **Browser**: Some browsers have default focus styles - check in Chrome/Firefox.
- **Custom Styles**: Verify `focus-visible:ring-2` classes are applied.

---

## 📚 Additional Resources

- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Keyboard Testing**: https://webaim.org/articles/keyboard/
- **Screen Reader Testing**: https://webaim.org/articles/screenreader_testing/
- **VoiceOver Guide**: https://webaim.org/articles/voiceover/
- **NVDA Guide**: https://webaim.org/articles/nvda/

---

**Last Updated**: 2025-01-16
**Next Review**: After production deployment
