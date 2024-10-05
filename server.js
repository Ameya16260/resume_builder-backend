const express = require('express');
const path = require('path');
const fs = require('fs');
const latex = require('node-latex');
const cors = require('cors');

const app = express();
app.use(express.json());
const corsOptions = {
    origin: 'http://resume-generator-ameya.s3-website.ap-south-1.amazonaws.com', // Replace with your actual S3 bucket domain
    methods: 'GET,POST',
    credentials: true, // Allow cookies or authentication tokens to be sent along with requests
};
app.use(cors(corsOptions));
const port = 4000;
app.get('/output.pdf', (req, res) => {
    const pdfPath = path.join(__dirname, 'output.pdf');

    if (fs.existsSync(pdfPath)) {
        res.sendFile(pdfPath);
    } else {
        res.status(404).send('PDF not found');
    }
});

app.post('/generate-pdf', (req, res) => {
    try {
        const { details, objective, education, experience, projects } = req.body;

        console.log("Received data:");
        console.log("Details:", details);
        console.log("Objective:", objective);
        console.log("Education:", education);
        console.log("Experience:", experience);
        console.log("Projects:", projects);

        let latexTemplate = fs.readFileSync('details.tex', 'utf8');
        let packagestemplate = fs.readFileSync('packages.tex', 'utf8');
        let objectivetemplate = fs.readFileSync('objective.tex', 'utf8');
        let header1 = fs.readFileSync('header1.tex', 'utf8');
        let educationtem = fs.readFileSync('education.tex', 'utf8');
        let footer = fs.readFileSync('footer.tex', 'utf8');
        let header2 = fs.readFileSync('header2.tex', 'utf8');
        let experiencetem = fs.readFileSync('experience.tex', 'utf8');
        let header3 = fs.readFileSync('header3.tex', 'utf8');
        let projecttem = fs.readFileSync('project.tex', 'utf8');
        let end = fs.readFileSync('end.tex', 'utf8');


        latexTemplate = latexTemplate.replace('{{name}}', details.name).replace(/{email}/g, details.email).replace(/{mobile}/, details.mobile).replace('{adress}', details.address + ' ' + details.city + ' ' + details.state + " " + details.country).replace('{github}', details.githubId).replace('{linkedin}', details.linkedinId);
        objectivetemplate = objectivetemplate.replace('{objective}', objective.obj);

        let final = packagestemplate + latexTemplate + objectivetemplate + header1;

        // Process education
        if (education !== undefined) {

            education.arr.forEach(ed => {
                let a = educationtem.replace('{institute}', ed.title)
                    .replace('{location}', ed.location)
                    .replace('{degree}', ed.degree)
                    .replace('{start}', ed.startDate)
                    .replace('{end}', ed.endDate);
                final += a;
            });

        } else {
            let a = "\n" + "\\item" + "\n";
            final += a;
        }
        final += footer + header2;

        // Process experience
        if (experience !== undefined) {

            for (let ex of experience.arr) {
                let a = "\\item"
                let full_des = "";
                for (let des of ex.descriptionArray) {
                    full_des += a + " " + des + "\n";
                }
                a = experiencetem.replace("{company}", ex.title).replace("{location}", ex.location).replace("{start}", ex.startDate).replace("{end}", ex.endDate).replace("{description}", full_des).replace("{title}", ex.subtitle);
                final += a + "\n";
                console.log("working");
            }

        } else {
            let a = "\n" + "\\item" + "\n";
            final += a;

        }
        final += footer + header3;

        // Process projects
        if (projects !== undefined) {

            for (let pr of projects.arr) {
                let a = "\\item"
                let b = ""
                let full_des = "";
                for (let des of pr.descriptionArray) {
                    full_des += a + " " + des + "\n";
                }
                a = projecttem.replace("{description}", full_des).replace("{title}", pr.title).replace('breif', pr.brief).replace('{tools}', pr.tools).replace("{github}", pr.github);
                final += a;
            }

        } else {
            let a = "\n" + "\\item" + "\n";
            final += a;
        }
        final += footer + end;

        // Write the modified LaTeX template to a temporary file
        const tempLatexPath = path.join(__dirname, 'temp2.tex');
        fs.writeFileSync(tempLatexPath, final);

        // Generate PDF
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

    } catch (err) {
        console.error('Error in /generate-pdf:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Serve the HTML file for PDF preview (Optional if needed)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
