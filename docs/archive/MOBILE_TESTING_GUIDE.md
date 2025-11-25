# 📱 Mobile Features Testing Guide

## Quick Start

### How to Test Mobile Features

1. **Using Browser DevTools:**
   ```
   Chrome/Edge: F12 → Toggle device toolbar (Ctrl+Shift+M)
   Firefox: F12 → Responsive Design Mode (Ctrl+Shift+M)
   Safari: Develop → Enter Responsive Design Mode
   ```

2. **Recommended Test Devices:**
   - iPhone 12 Pro (390x844)
   - iPhone 14 Pro Max (430x932)
   - Samsung Galaxy S21 (360x800)
   - iPad Pro (1024x1366)

3. **Best Practice:**
   - Test on actual devices for accurate touch behavior
   - Test both portrait and landscape orientations
   - Clear browser cache before testing

---

## Feature Testing Checklist

### 1. Mobile Navigation ✅

**How to Test:**
1. Open app on mobile viewport (<1024px width)
2. Click hamburger menu (☰) in top-left corner
3. Verify drawer slides in from left
4. Click navigation links (should close menu automatically)
5. Click backdrop (should close menu)
6. Click × button in drawer (should close menu)
7. Resize to desktop (menu should auto-close)

**Expected Behavior:**
- Fixed header stays at top (60px height)
- Drawer animates smoothly (0.3s)
- Backdrop has blur effect
- Body scroll is locked when menu open
- Theme toggle accessible in menu

**Test on:**
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)
- [ ] Portrait orientation
- [ ] Landscape orientation

---

### 2. Mobile Data Tables (Card View) ✅

**How to Test:**
1. Navigate to Dashboard
2. View "Date-Wise Analysis" section
3. Resize to mobile (<1024px)
4. Verify cards appear instead of table
5. Scroll through companies
6. Tap "Edit" and "Comment" buttons

**Expected Behavior:**
- Desktop table hidden on mobile
- Mobile cards displayed (one per company)
- Cards show: ticker, company name, price, change, occurrences
- Edit button opens modal
- Comment button opens comment modal
- Cards have active states when tapped
- Empty state shows "No data" message

**Test on:**
- [ ] Date-wise view (gainers-view-date)
- [ ] Threshold view (gainers-view-threshold)
- [ ] Dark mode
- [ ] Light mode

---

### 3. Modal Bottom Sheet ✅

**How to Test:**
1. On mobile, click "Edit" button on any company card
2. Verify modal slides up from bottom
3. Verify drag handle is visible
4. Scroll modal content
5. Tap backdrop to close
6. Tap × button to close

**Expected Behavior:**
- Modal appears as bottom sheet (rounded top corners)
- Drag handle visible at top
- Smooth slide-up animation (0.3s)
- Max height 90vh
- Content scrollable if overflows
- Backdrop blurred and semi-transparent
- Close button (rounded, right-aligned)

**Test Scenarios:**
- [ ] Edit Company Modal
- [ ] Comment Modal
- [ ] Portrait orientation
- [ ] Landscape orientation

---

### 4. Touch-Optimized Forms ✅

**How to Test:**
1. On mobile, open login page
2. Tap email input
3. Verify no auto-zoom occurs
4. Check input height (should be 48px)
5. Try typing in inputs
6. Tap submit button

**Expected Behavior:**
- Input fields are 48px height
- Font size is 16px (prevents iOS zoom)
- Buttons are 48px height
- Full-width layout on mobile
- Proper spacing and padding
- Keyboard appears correctly

**Test Forms:**
- [ ] Login form
- [ ] Register form (if optimized)
- [ ] Edit modal category input
- [ ] Edit modal comment textarea
- [ ] Comment modal textarea

---

### 5. Chart Optimization ✅

**How to Test:**
1. On mobile, open Edit Company Modal
2. Scroll to "Price History" chart
3. Verify chart height (should be 200px)
4. Tap data points to see tooltips
5. Try zooming/panning chart

**Expected Behavior:**
- Chart height is 200px (mobile) vs 256px (desktop)
- Legend hidden on mobile
- Axis labels are readable (9px font)
- Tooltips appear on tap (11px font)
- Grid lines hidden on mobile (x-axis)
- Limited tick count (6 max)
- Points are smaller (2px radius)
- Responsive to container width

**Test:**
- [ ] Chart display
- [ ] Tooltip interaction
- [ ] Dark mode chart colors
- [ ] Light mode chart colors

---

### 6. Theme Toggle ✅

**How to Test:**
1. On mobile viewport
2. Locate theme toggle button (bottom-right, 80px from bottom)
3. Tap to switch between light/dark mode
4. Verify all components update colors
5. Open/close menu (theme toggle should work)

**Expected Behavior:**
- Button positioned correctly (doesn't overlap footer)
- Button is touch-friendly (56px × 32px)
- Smooth color transitions
- All components respect theme (cards, modals, charts, etc.)
- Theme persists across page navigations

**Test:**
- [ ] Light → Dark transition
- [ ] Dark → Light transition
- [ ] With menu open
- [ ] With modal open

---

### 7. Button Touch Targets ✅

**How to Test:**
1. On mobile, try tapping all buttons
2. Measure tap targets using browser tools
3. Verify minimum 44x44px size

**Expected Behavior:**
- All buttons are minimum 44×44px
- Most buttons are 48px height for comfort
- Proper spacing between buttons
- Active states provide feedback
- No accidental double-taps

**Test Buttons:**
- [ ] Hamburger menu button
- [ ] Navigation links
- [ ] Edit buttons on cards
- [ ] Comment buttons on cards
- [ ] Modal action buttons (Save, Cancel)
- [ ] Previous/Next navigation buttons
- [ ] Theme toggle button

---

## Accessibility Testing

### Touch Target Compliance
- **Standard:** WCAG 2.1 AA (44×44px minimum)
- **Implemented:** Most touch targets are 48px (exceeds standard)

### Color Contrast
- Test in both light and dark modes
- Verify text is readable on all backgrounds
- Check badge colors (Good, Poor, etc.)

### Screen Reader (Optional)
- Test with VoiceOver (iOS) or TalkBack (Android)
- Verify labels are descriptive
- Check modal accessibility

---

## Known Mobile-Specific Behaviors

### iOS Safari
- Input zoom prevented by 16px font size
- Smooth scrolling may differ from Android
- Backdrop blur fully supported

### Android Chrome
- Touch feedback (ripple effect) may appear
- Scrolling behavior may differ slightly
- Date picker UI is native Android style

### Landscape Orientation
- Modal may take more screen height
- Chart may expand horizontally
- Navigation drawer still works

---

## Performance Testing

### Key Metrics to Monitor
1. **First Contentful Paint (FCP):** < 1.5s
2. **Largest Contentful Paint (LCP):** < 2.5s
3. **Interaction to Next Paint (INP):** < 200ms
4. **Cumulative Layout Shift (CLS):** < 0.1

### How to Test Performance
```bash
# Run production build
ng build --configuration production

# Serve and test
ng serve --configuration production

# Or use Lighthouse in Chrome DevTools
Chrome DevTools → Lighthouse → Mobile → Generate Report
```

---

## Troubleshooting Common Issues

### Issue: Menu doesn't close on navigation
**Solution:** Check that `closeMenu()` is called in sidebar component's navigation click handler

### Issue: Modal is full-screen instead of bottom sheet
**Solution:** Verify screen width is <640px in browser DevTools device mode

### Issue: Inputs are zooming on iOS
**Solution:** Confirm font-size is 16px or larger on input fields

### Issue: Chart is not responsive
**Solution:** Check that `responsive: true` and `maintainAspectRatio: false` in Chart.js config

### Issue: Cards not appearing on mobile
**Solution:** 
- Verify breakpoint is <1024px
- Check that BreakpointService is injected
- Confirm `.mobile-card-view` has `display: flex` on mobile

---

## Regression Testing

After future updates, re-test these critical paths:

1. **Navigation Flow:**
   - Login → Dashboard → Edit Company → Save → Close

2. **Data Display:**
   - View both table layouts (date-wise + threshold)
   - Switch between mobile and desktop viewports
   - Toggle theme mode

3. **Modal Interactions:**
   - Open edit modal → Navigate (Previous/Next) → Close
   - Open comment modal → Enter text → Save

4. **Form Submissions:**
   - Login with credentials
   - Update company category and comments
   - Add new comment

---

## Browser Support Matrix

| Browser | Version | Mobile Support | Desktop Support | Notes |
|---------|---------|----------------|-----------------|-------|
| Chrome | 90+ | ✅ Full | ✅ Full | Recommended |
| Safari | 14+ | ✅ Full | ✅ Full | iOS/macOS |
| Firefox | 88+ | ✅ Full | ✅ Full | Good |
| Edge | 90+ | ✅ Full | ✅ Full | Chromium-based |
| Samsung Internet | 14+ | ✅ Full | N/A | Android |

---

## Quick Reference: Breakpoints

| Breakpoint | Width Range | Layout Type |
|------------|-------------|-------------|
| Mobile | < 640px | Single column, cards, hamburger menu |
| Tablet | 640px - 1023px | Adaptive, drawer menu |
| Desktop | ≥ 1024px | Multi-column, sidebar, tables |

---

## Next Steps After Testing

1. **If All Tests Pass:**
   - Document any device-specific quirks
   - Proceed with user acceptance testing (UAT)
   - Prepare for production deployment

2. **If Issues Found:**
   - Log issues with device/browser details
   - Prioritize based on user impact
   - Fix and re-test

3. **Optional Enhancements:**
   - Implement swipe gestures (see MOBILE_COMPLETION_SUMMARY.md)
   - Add pull-to-refresh
   - Optimize remaining forms (register, stock upload)

---

## Additional Resources

- **Full Implementation Details:** [MOBILE_COMPLETION_SUMMARY.md](./MOBILE_COMPLETION_SUMMARY.md)
- **Original Implementation Guide:** [MOBILE_IMPLEMENTATION.md](./MOBILE_IMPLEMENTATION.md)
- **Project Overview:** [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)

---

**Testing Completed By:** _____________  
**Date:** _____________  
**Devices Tested:** _____________  
**Issues Found:** _____________
