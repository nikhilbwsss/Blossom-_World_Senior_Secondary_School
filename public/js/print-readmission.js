function escapeReadmissionHtml(value) {
    if (value == null) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function ensureReadmissionJsPdf() {
    if (window.jspdf && window.jspdf.jsPDF) return;
    await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        s.onload = resolve;
        s.onerror = reject;
        document.body.appendChild(s);
    });
}

async function ensureReadmissionHtml2Canvas() {
    if (window.html2canvas) return;
    await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        s.onload = resolve;
        s.onerror = reject;
        document.body.appendChild(s);
    });
}

function getReadmissionPrintHtml(data, appId) {
    const currentDate = new Date().toLocaleDateString('en-GB');

    return `
    <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Official Re-Admission Form - Blossom World</title>
            <style>
                @page { size: A4; margin: 10mm; }
                @media print {
                    html, body { width: 210mm; min-height: 297mm; margin: 0; padding: 0; }
                    .no-print { display: none !important; }
                }
                * { box-sizing: border-box; }
                body {
                    font-family: 'Times New Roman', serif;
                    color: #000;
                    line-height: 1.5;
                    background: #fff;
                    margin: 0;
                    padding: 0;
                }
                .page {
                    width: 190mm;
                    min-height: 277mm;
                    margin: 0 auto;
                    padding: 8mm;
                }
                .outer-border {
                    border: 3px double #000;
                    padding: 20px;
                    min-height: calc(277mm - 16mm);
                    position: relative;
                    background: #fff;
                }
                .header-table {
                    width: 100%;
                    border-bottom: 2px solid #000;
                    margin-bottom: 20px;
                }
                .school-name {
                    font-size: 15px;
                    font-weight: bold;
                    margin: 0;
                    color: #001f3f;
                    text-align: center;
                }
                .sub-header {
                    text-align: center;
                    font-size: 14px;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                .photo-box {
                    position: absolute;
                    top: 30px;
                    right: 1px;
                    width: 120px;
                    height: 150px;
                    border: 1px solid #000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    background: #f9f9f9;
                    text-align: center;
                }
                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                }
                .data-table td {
                    padding: 8px;
                    vertical-align: top;
                    border-bottom: 1px solid #eee;
                    word-break: break-word;
                }
                .label {
                    font-weight: bold;
                    width: 35%;
                }
                .sig-container {
                    margin-top: 60px;
                    display: flex;
                    justify-content: space-between;
                    gap: 16px;
                    text-align: center;
                }
                .sig-item {
                    width: 30%;
                    position: relative;
                }
                .sig-line {
                    border-top: 1px solid #000;
                    margin-top: 50px;
                    padding-top: 5px;
                    font-weight: bold;
                }
                .student-sig-img {
                    position: absolute;
                    bottom: 55px;
                    left: 50%;
                    transform: translateX(-50%);
                    max-height: 50px;
                    max-width: 100%;
                }
                .watermark {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) rotate(-45deg);
                    font-size: 80px;
                    color: rgba(0,0,0,0.05);
                    z-index: 0;
                    white-space: nowrap;
                }
                .content {
                    position: relative;
                    z-index: 1;
                }
                .footer-note {
                    margin-top: 40px;
                    font-size: 11px;
                    color: #555;
                    border-top: 1px dashed #ccc;
                    padding-top: 10px;
                }
            </style>
        </head>
        <body>
            <div class="page">
                <div class="outer-border">
                    <div class="watermark">BLOSSOM WORLD</div>
                    <div class="content">
                        <div class="photo-box">
                            ${data.studentPhotoDataUrl ? `<img src="${escapeReadmissionHtml(data.studentPhotoDataUrl)}" style="width:100%;height:100%;object-fit:cover;">` : 'Affix Photo'}
                        </div>

                        <div class="header-table">
                            <div style="text-align:center; margin-bottom:10px;"><img src="/img/logo.jpg" style="height:70px;"></div>
                            <h1 class="school-name">BLOSSOM WORLD SENIOR SECONDARY SCHOOL</h1>
                            <p class="sub-header">Uttarkrishnapur Pt-II, Silchar, Cachar, Assam - 788006</p>
                            <div style="background:#001f3f; color:#fff; text-align:center; padding:5px; font-weight:bold; border-radius:50px; width:60%; margin: 10px auto;">RE-ADMISSION FORM (2026-27)</div>
                        </div>

                        <table class="data-table">
                            <tr><td class="label">Application ID:</td><td>${escapeReadmissionHtml(appId || 'N/A')}</td></tr>
                            <tr><td class="label">Student Name (Aadhaar):</td><td style="text-transform:uppercase; font-weight:bold;">${escapeReadmissionHtml(data.studentName || '')}</td></tr>
                            <tr><td class="label">Father's Name:</td><td>${escapeReadmissionHtml(data.fatherName || '')}</td></tr>
                            <tr><td class="label">Mother's Name:</td><td>${escapeReadmissionHtml(data.motherName || '')}</td></tr>
                            <tr><td class="label">Permanent Address:</td><td>${escapeReadmissionHtml(data.permanentAddress || '')}</td></tr>
                            <tr><td class="label">Parent WhatsApp:</td><td>${escapeReadmissionHtml(data.parentWhatsapp || '')}</td></tr>
                            <tr><td class="label">Student Aadhaar No:</td><td>${escapeReadmissionHtml(data.studentAadhaar || '')}</td></tr>
                            <tr><td class="label">Marks % (Prev. Class):</td><td>${escapeReadmissionHtml(data.previousMarksPercentage || '0')}%</td></tr>
                            <tr><td class="label">Attendance % (Prev. Class):</td><td>${escapeReadmissionHtml(data.previousAttendancePercentage || '0')}%</td></tr>
                            <tr><td class="label">Health Profile:</td><td>Height: ${escapeReadmissionHtml(data.height || '--')} cm | Weight: ${escapeReadmissionHtml(data.weight || '--')} kg</td></tr>
                            <tr><td class="label">Date of Submission:</td><td>${escapeReadmissionHtml(data.admissionDate || currentDate)}</td></tr>
                        </table>

                        <div class="sig-container">
                            <div class="sig-item">
                                ${data.studentSignatureDataUrl ? `<img src="${escapeReadmissionHtml(data.studentSignatureDataUrl)}" class="student-sig-img">` : ''}
                                <div class="sig-line">Student Signature</div>
                            </div>
                            <div class="sig-item">
                                <div class="sig-line">Parent/Guardian Signature</div>
                            </div>
                            <div class="sig-item">
                                <div class="sig-line">Principal</div>
                            </div>
                        </div>

                        <div class="footer-note">
                            * This is a computer-generated form for record purposes. Any discrepancy should be reported to the office immediately.
                        </div>
                    </div>
                </div>
            </div>
        </body>
    </html>`;
}

async function downloadReAdmissionPdf(data, appId) {
    await ensureReadmissionJsPdf();
    await ensureReadmissionHtml2Canvas();

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const printHtml = getReadmissionPrintHtml(data, appId);

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
    iframeDoc.write(printHtml);
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
    const margin = 0;
    const imgWidth = pageWidth - (margin * 2);
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let offset = 0;
    while (offset < imgHeight) {
        doc.addImage(imgData, 'JPEG', margin, margin - offset, imgWidth, imgHeight);
        offset += pageHeight;
        if (offset < imgHeight) doc.addPage();
    }

    doc.save(`re-admission-${appId || Date.now()}.pdf`);
}

function printConfirmation(data, appId) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Popup blocked. Please allow popups and try again.');
        return;
    }

    const targetDoc = printWindow.document;
    targetDoc.write(getReadmissionPrintHtml(data, appId));

    targetDoc.close();
    setTimeout(() => {
        printWindow.focus();
        printWindow.print();
    }, 800);
}

window.downloadReAdmissionPdf = downloadReAdmissionPdf;
window.printConfirmation = printConfirmation;
