function downloadPdf(filename) {
    const pdf = document.querySelector(".bn-container");
    html2pdf().from(pdf).save(`${filename}.pdf`)
}