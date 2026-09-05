# Felicity Dhol Tasha Attendance — GitHub Pages / Plain JSON

This is a static website. It uses `attendance.json` as the initial attendance source and browser `localStorage` for Admin edits. No database or backend is used.

## Public view
- No Batch dropdown is shown.
- Select an Attendance Date with the calendar.
- The first page shows a table containing only members marked Present across **all three batches** for that date.
- Columns: **Sr. No. | Flat No | Name | Batch**.

## Admin view
- Admin logs in using the configured credentials.
- Attendance Date remains the calendar selector at the top.
- Batch selector appears immediately beside the date selector in the admin controls.
- The member table is directly below the date/batch/search controls, rather than occupying a separate right-hand area.
- Search by Sr. No., Name, or Flat No.
- Mark Present / Mark Absent.
- Export/import attendance JSON.
- Download PDF for selected date/batch or all attendance.

## Static hosting limitation
A static GitHub Pages site cannot write back to `attendance.json` on the server. Admin changes are saved in browser localStorage. Use **Export Attendance JSON**, then commit/replace `attendance.json` in the GitHub repository to publish changes to all visitors.


## Updating attendance on GitHub Pages

After the Admin marks attendance, click **Download Updated Website Data**. This downloads the current `attendance.json` containing only the latest Present records. Replace the existing `attendance.json` in the GitHub repository with the downloaded file and commit the change. GitHub Pages will then publish the updated attendance.
