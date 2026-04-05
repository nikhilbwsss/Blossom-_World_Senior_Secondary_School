/**
 * Print Receipt Handler for Admission Form
 * Handles printing and downloading of admission receipts
 * Paper Size: A4 (210mm x 297mm)
 * File: public/js/print-receipt.js
 */

// Paper Size Configuration
const PAPER_SIZE = {
    A4: {
        width: '21cm',
        height: '29.7cm',
        name: 'A4 (210mm x 297mm)'
    },
    LETTER: {
        width: '8.5in',
        height: '11in',
        name: 'Letter (8.5" x 11")'
    }
};

// Current paper size (default: A4)
let currentPaperSize = 'A4';

/**
 * Set Paper Size for Print
 * @param {string} paperSize - 'A4' or 'LETTER'
 */
function setPaperSize(paperSize = 'A4') {
    if (PAPER_SIZE[paperSize]) {
        currentPaperSize = paperSize;
    } else {
        currentPaperSize = 'A4';
    }
}

/**
 * Get Current Paper Size Info
 * @returns {Object} Paper size configuration
 */
function getCurrentPaperSize() {
    return PAPER_SIZE[currentPaperSize];
}

/**
 * Escape HTML special characters
 * @param {string} value - Value to escape
 * @returns {string} Escaped HTML string
 */
function escapeHtml(value) {
    if (!value) return '';
    return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Escape with fallback value
const escapeOrFallback = (value, fallback) => {
    const raw = value == null ? '' : String(value);
    const trimmed = raw.trim();
    return trimmed ? escapeHtml(trimmed) : fallback;
};

// Format field values by removing units
const formatFieldValue = (value, unit) => {
    if (!value) return '__';
    return String(value).trim().replace(new RegExp(`\\s*${unit}$`, 'i'), '');
};

/**
 * Print Admission Receipt
 * @param {Object} data - Form data object containing student and parent information
 * @param {string} appId - Application ID
 */
function printAdmissionReceipt(data, appId) {
    const printWindow = window.open('', '_blank');
    const iframe = !printWindow ? document.createElement('iframe') : null;

    if (iframe) {
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);
    }

    const targetDoc = printWindow ? printWindow.document : iframe.contentWindow.document;
    const currentDate = new Date().toLocaleDateString('en-GB');
    
    // Parse field values
    const heightVal = formatFieldValue(data.height, 'cm');
    const weightVal = formatFieldValue(data.weight, 'kg');
    const distanceVal = formatFieldValue(data.distanceFromSchool, 'km');

    // Generate receipt HTML
    const receiptHtml = generateReceiptHtml(data, appId, currentDate, heightVal, weightVal, distanceVal);
    
    targetDoc.write(receiptHtml);
    targetDoc.close();

    // Trigger print after document loads
    setTimeout(() => {
        if (printWindow) {
            printWindow.focus();
            // Set paper size preferences for the browser
            printWindow.print();
        } else if (iframe && iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            setTimeout(() => iframe.remove(), 1000);
        }
    }, 700);
}

/**
 * Generate Receipt HTML Template
 * @param {Object} data - Form data
 * @param {string} appId - Application ID
 * @param {string} currentDate - Current date
 * @param {string} heightVal - Height value
 * @param {string} weightVal - Weight value
 * @param {string} distanceVal - Distance value
 * @returns {string} HTML string for receipt
 */
function generateReceiptHtml(data, appId, currentDate, heightVal, weightVal, distanceVal) {
    return `
    <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Admission Receipt - Blossom World</title>
            <style>
                ${getReceiptStyles()}
            </style>
        </head>
        <body>
            <div class="form-border">
                <div class="photo-box">
                    ${data.studentPhotoDataUrl
                        ? `<img src="${escapeHtml(data.studentPhotoDataUrl)}" alt="Student Photo" style="width:100%;height:100%;object-fit:cover;">`
                        : 'Affix recent passport size color photo of the candidate'
                    }
                </div>

                <div class="header">
                    <img src="/img/logo.jpg" alt="School Logo" style="height:60px; margin-bottom:6px;">
                    <h1 class="school-name">BLOSSOM WORLD SENIOR SECONDARY SCHOOL</h1>
                    <div class="school-loc">Uttarkrishnapur-II, Cachar, Assam</div>
                    <div class="form-title">APPLICATION FORM</div>
                    <p><strong>Application ID:</strong> ${escapeOrFallback(appId, '________')}</p>
                </div>

                <p><strong>To, The Principal,</strong> Sir/Madam, I beg to apply for the admission of my son/daughter/ward <strong>${escapeHtml(((data.firstName || '') + ' ' + (data.middleName || '') + ' ' + (data.lastName || '')).toUpperCase())}</strong> in your school. The particulars are furnished below:</p>

                ${generateStudentParticulars(data)}
                ${generateParentalDetails(data)}
                ${generateAdditionalDetails(data, heightVal, weightVal, distanceVal)}
                ${generateTransferStudentInfo(data)}
                ${generateSignatureSection()}
                ${generateDeclarationSection(data, currentDate)}
                ${generateOfficeUseSection()}
            </div>
        </body>
    </html>
    `;
}

/**
 * Get CSS Styles for Receipt
 * @returns {string} CSS styles
 */
function getReceiptStyles() {
    return `
        @media print {
            * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            .no-print { display: none !important; }
            @page {
                size: A4;
                margin: 0.5cm;
                padding: 0;
            }
            html, body {
                width: auto;
                min-height: 29.7cm;
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                padding: 0.5cm;
            }
        }
        body {
            font-family: 'Times New Roman', Times, serif;
            padding: 20px;
            color: #000;
            line-height: 1.3;
            font-size: 13px;
            width: auto;
            max-width: calc(21cm - 2rem);
            min-height: 29.7cm;
            margin: 0 auto;
            box-sizing: border-box;
        }
        .form-border {
            border: 2px solid #000;
            padding: 15px;
            position: relative;
            width: 100%;
            box-sizing: border-box;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #000;
            margin-bottom: 10px;
            padding-bottom: 10px;
        }
        .school-name {
            font-size: 17px;
            font-weight: bold;
            margin: 0;
        }
        .school-loc {
            font-size: 14px;
            margin-top: 5px;
        }
        .form-title {
            font-weight: bold;
            text-decoration: underline;
            font-size: 16px;
            margin-top: 10px;
        }
        .meta-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            font-weight: bold;
        }
        .photo-box {
            position: absolute;
            top: 15px;
            right: 15px;
            width: 110px;
            height: 130px;
            border: 1px solid #000;
            text-align: center;
            font-size: 10px;
            padding: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        .section-head {
            background: #eee;
            font-weight: bold;
            padding: 3px 8px;
            margin-top: 15px;
            border: 1px solid #000;
            font-size: 13px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 5px;
        }
        th {
            text-align: left;
            width: 35%;
            padding: 4px;
            border: 1px solid #ccc;
            font-weight: bold;
            background: #fafafa;
        }
        td {
            padding: 4px;
            border: 1px solid #ccc;
        }
        .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }
        .sig-section {
            margin-top: 25px;
            display: flex;
            justify-content: space-between;
            text-align: center;
        }
        .sig-box {
            width: 30%;
        }
        .sig-line {
            border-top: 1px solid #000;
            margin-top: 40px;
            padding-top: 5px;
            font-weight: bold;
            font-size: 11px;
        }
        .declaration-box {
            margin-top: 20px;
            font-size: 12px;
            text-align: justify;
            border: 1px solid #000;
            padding: 10px;
        }
        .office-use {
            margin-top: 20px;
            border: 2px solid #000;
            padding: 10px;
            background: #fff;
        }
        .office-title {
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 8px;
            text-align: center;
        }
        .checkbox-item {
            margin-right: 15px;
            display: inline-block;
        }
    `;
}

/**
 * Generate Student Particulars Section
 */
function generateStudentParticulars(data) {
    return `
    <div class="section-head">1. STUDENT PARTICULARS</div>
    <table>
        <tr><th>Aadhaar / APAAR ID</th><td>${escapeOrFallback(data.aadhaarNumber, '________')} / ${escapeOrFallback(data.apaarId, '________')}</td></tr>
        <tr><th>Class / DOB</th><td>${escapeOrFallback(data.requiredClass, '________')} / ${escapeOrFallback(data.dob, '________')}</td></tr>
        <tr><th>Blood Group / Identification</th><td>${escapeOrFallback(data.bloodGroup, '________')} / ${escapeOrFallback(data.identificationMark, '________')}</td></tr>
        <tr><th>Religion / Caste / Nationality</th><td>${escapeOrFallback(data.religion, '________')} / ${escapeOrFallback(data.caste, '________')} / ${escapeOrFallback(data.nationality, 'Indian')}</td></tr>
        <tr><th>Address</th><td>${escapeOrFallback(data.presentAddress, '________')}</td></tr>
        <tr><th>Email</th><td>${escapeOrFallback(data.email, '________')}</td></tr>
        <tr><th>Contact No.</th><td>${escapeOrFallback(data.mobile, '________')}</td></tr>
    </table>
    `;
}

/**
 * Generate Parental Details Section
 */
function generateParentalDetails(data) {
    return `
    <div class="grid-2">
        <div>
            <div class="section-head">2. FATHER'S PARTICULARS</div>
            <table>
                <tr><th>Name</th><td>${escapeOrFallback(data.fatherName, '________')}</td></tr>
                <tr><th>Occupation / Income</th><td>${escapeOrFallback(data.fatherOccupation, '________')} / ${escapeOrFallback(data.fatherIncome, '________')}</td></tr>
                <tr><th>Education</th><td>${escapeOrFallback(data.fatherEducation, '________')}</td></tr>
                <tr><th>Aadhaar / WhatsApp</th><td>${escapeOrFallback(data.fatherAadhaar, '________')} / ${escapeOrFallback(data.fatherWhatsApp, '________')}</td></tr>
            </table>
        </div>
        <div>
            <div class="section-head">3. MOTHER'S PARTICULARS</div>
            <table>
                <tr><th>Name</th><td>${escapeOrFallback(data.motherName, '________')}</td></tr>
                <tr><th>Occupation / Income</th><td>${escapeOrFallback(data.motherOccupation, '________')} / ${escapeOrFallback(data.motherIncome, '________')}</td></tr>
                <tr><th>Education</th><td>${escapeOrFallback(data.motherEducation, '________')}</td></tr>
                <tr><th>Contact No.</th><td>${escapeOrFallback(data.motherContact, '________')}</td></tr>
            </table>
        </div>
    </div>
    `;
}

/**
 * Generate Additional Details Section
 */
function generateAdditionalDetails(data, heightVal, weightVal, distanceVal) {
    return `
    <div class="section-head">4. ADDITIONAL DETAILS</div>
    <table>
        <tr><th>Local Guardian</th><td>${escapeOrFallback(data.localGuardianName, '________________')}</td></tr>
        <tr><th>Siblings in School</th><td>${escapeOrFallback(data.siblingsInSchool, 'None')}</td></tr>
        <tr><th>Physical Status</th><td>Handicapped: ${escapeOrFallback(data.isHandicapped, 'No')}</td></tr>
        <tr><th>Height / Weight / Distance</th><td>${escapeHtml(heightVal)} cm / ${escapeHtml(weightVal)} kg / ${escapeHtml(distanceVal)} km</td></tr>
    </table>
    `;
}

/**
 * Generate Transfer Student Information Section
 */
function generateTransferStudentInfo(data) {
    return `
    <div class="section-head">5. PREVIOUS SCHOOL INFORMATION</div>
    <table>
        <tr><th>Previous School / DISE</th><td>${escapeOrFallback(data.previousSchool, '________________')} / ${escapeOrFallback(data.previousSchoolDise, '________')}</td></tr>
        <tr><th>PEN / APAAR ID</th><td>${escapeOrFallback(data.previousSchoolPen, '________')}</td></tr>
        <tr><th>Previous Result / Attendance</th><td>${escapeOrFallback(data.previousResult, '____')}% / ${escapeOrFallback(data.previousSchoolAttendance, '____')}%</td></tr>
        <tr><th>Class Last Attended</th><td>${escapeOrFallback(data.previousSchoolClass, '________')}</td></tr>
    </table>
    `;
}

/**
 * Generate Signature Section
 */
function generateSignatureSection() {
    return `
    <div class="section-head">6. SPECIMEN SIGNATURES</div>
    <div class="sig-section">
        <div class="sig-box"><div class="sig-line">Local Guardian</div></div>
        <div class="sig-box"><div class="sig-line">Mother</div></div>
        <div class="sig-box"><div class="sig-line">Father</div></div>
    </div>
    `;
}

/**
 * Generate Declaration Section
 */
function generateDeclarationSection(data, currentDate) {
    return `
    <div class="declaration-box">
        <strong>DECLARATION:</strong><br>
        I hereby declare that the information supplied above is true to the best of my knowledge and belief. The rules and regulation of the school shall be strictly adhered to by my son/daughter/ward. Any hindrance on my child's part, he/she shall accept any decision deemed by the school authority.
        <br><br>
        <strong>Date:</strong> ${escapeHtml(currentDate)} &nbsp;&nbsp;&nbsp; <strong>Place:</strong> ${escapeOrFallback(data.applicationPlace, '__________')}
        <div style="float:right; text-align:center; width:200px; border-top:1px solid #000; margin-top:20px; font-size:11px;">Signature of Applicant / Guardian</div>
        <div style="clear:both;"></div>
        <p style="font-size:10px; margin-top:10px;"><strong>N.B.: Fees once paid will not be returned under any circumstances.</strong></p>
    </div>
    `;
}

/**
 * Generate Office Use Section
 */
function generateOfficeUseSection() {
    return `
    <div class="office-use">
        <div class="office-title">FOR OFFICIAL USE ONLY</div>
        <div>
            <div style="margin-bottom:8px;"><strong>Admission Number:</strong> ______________________ &nbsp;&nbsp; <strong>Date:</strong> ______________</div>
            <div style="margin-bottom:8px;"><strong>Remarks:</strong> ___________________________________________________</div>
            <div style="margin-top:10px;">
                <span class="checkbox-item">☐ Document Complete</span>
                <span class="checkbox-item">☐ Document Incomplete</span>
                <span class="checkbox-item">☐ Admission Allowed</span>
            </div>
            <div style="margin-top:8px;">
                <span class="checkbox-item">☐ Not Allowed</span>
                <span class="checkbox-item">☐ Provisional</span>
            </div>
            <div style="margin-top:15px; text-align:right;">
                <div style="border-top:1px solid #000; width:200px; margin-left:auto;">
                    <div style="font-size:10px; margin-top:5px;"><strong>Authorized By:</strong></div>
                </div>
            </div>
        </div>
    </div>
    `;
}

async function ensureJsPdf() {
    if (window.jspdf && window.jspdf.jsPDF) return;
    await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        s.onload = resolve;
        s.onerror = reject;
        document.body.appendChild(s);
    });
}

async function ensureHtml2Canvas() {
    if (window.html2canvas) return;
    await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        s.onload = resolve;
        s.onerror = reject;
        document.body.appendChild(s);
    });
}

async function downloadAdmissionPdf(data, appId) {
    await ensureJsPdf();
    await ensureHtml2Canvas();

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const currentDate = new Date().toLocaleDateString('en-GB');
    const heightVal = formatFieldValue(data.height, 'cm');
    const weightVal = formatFieldValue(data.weight, 'kg');
    const distanceVal = formatFieldValue(data.distanceFromSchool, 'km');
    const receiptHtml = generateReceiptHtml(data, appId, currentDate, heightVal, weightVal, distanceVal);

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-10000px';
    iframe.style.top = '0';
    iframe.style.width = '794px';
    iframe.style.height = '1123px';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(receiptHtml);
    iframeDoc.close();

    const imgs = Array.from(iframeDoc.images || []);
    await Promise.allSettled(imgs.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
        });
    }));

    const canvas = await window.html2canvas(iframeDoc.body, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: 794,
        windowWidth: 794
    });

    iframe.remove();

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let offset = 0;
    const pageContentHeight = pageHeight - margin * 2;

    while (offset < imgHeight) {
        doc.addImage(imgData, 'JPEG', margin, margin - offset, imgWidth, imgHeight);
        offset += pageContentHeight;
        if (offset < imgHeight) doc.addPage();
    }

    doc.save(`admission-${appId || Date.now()}.pdf`);
}
