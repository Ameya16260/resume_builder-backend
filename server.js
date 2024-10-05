const express = require('express');
const path = require('path');
const fs = require('fs');
const latex = require('node-latex');
const cors = require('cors');

const app = express();
const port = 4000;
//vars


// Use CORS to allow requests from the React frontend
app.use(cors());

// Serve the generated PDF file
app.get('/output.pdf', (req, res) => {
    const pdfPath = path.join(__dirname, 'output.pdf');

    // Check if the PDF exists before serving it
    if (fs.existsSync(pdfPath)) {
        res.sendFile(pdfPath);
    } else {
        res.status(404).send('PDF not found');
    }
});
app.get('/generate', (req, res) => {
    const { details, objective, education, experience, projects } = req.query;
    console.log("details: " + details);
    console.log("objective: " + objective);
    console.log("education: " + education);
    console.log("experience: " + experience);
    console.log("projects: " + details);
})
// API endpoint to generate PDF
app.get('/generate-pdf', (req, res) => {
    const { name, roll } = req.query;

    if (!name || !roll) {
        return res.status(400).send('Name and roll number are required');
    }

    // Read the LaTeX template
    const inputPath = path.join(__dirname, 'input.tex');
    if (!fs.existsSync(inputPath)) {
        return res.status(400).send('Input file not found');
    }

    let latexTemplate = fs.readFileSync('input.tex', 'utf8');

    // Replace placeholders with actual values
    latexTemplate = latexTemplate.replace('{{name}}', name).replace('{{roll}}', roll);

    // Write the modified LaTeX template to a temporary file
    const tempLatexPath = path.join(__dirname, 'temp.tex');
    fs.writeFileSync(tempLatexPath, latexTemplate);

    const outputPath = path.join(__dirname, 'output.pdf');
    const input = fs.createReadStream(tempLatexPath);
    const output = fs.createWriteStream(outputPath);
    const pdf = latex(input);

    pdf.pipe(output);

    pdf.on('error', err => {
        console.error('Error generating PDF:', err);
        res.status(500).send('Error generating PDF');
    });

    output.on('finish', () => {
        console.log('PDF generated!');
        res.status(200).send('PDF generated successfully');
    });

    output.on('error', err => {
        console.error('Error writing PDF to file:', err);
        res.status(500).send('Error writing PDF to file');
    });
});

// Serve the HTML file for PDF preview (Optional if needed)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
