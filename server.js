const express = require('express');
const fs = require('fs'); // For synchronous fs functions
const fsp = fs.promises; // Alias for asynchronous fs functions
const latex = require('node-latex');
const cors = require('cors');
const { Readable } = require('stream'); // Required for in-memory stream

const app = express();
app.use(express.json());
app.use(cors());

const port = 4000;

// In-memory cache for LaTeX templates
let cachedTemplates = {};

const loadTemplates = async () => {
    try {
        // Read and cache all templates at server startup
        cachedTemplates.latexTemplate = await fsp.readFile('details.tex', 'utf8');
        cachedTemplates.packagestemplate = await fsp.readFile('packages.tex', 'utf8');
        cachedTemplates.objectivetemplate = await fsp.readFile('objective.tex', 'utf8');
        cachedTemplates.header1 = await fsp.readFile('header1.tex', 'utf8');
        cachedTemplates.educationtem = await fsp.readFile('education.tex', 'utf8');
        cachedTemplates.footer = await fsp.readFile('footer.tex', 'utf8');
        cachedTemplates.header2 = await fsp.readFile('header2.tex', 'utf8');
        cachedTemplates.experiencetem = await fsp.readFile('experience.tex', 'utf8');
        cachedTemplates.header3 = await fsp.readFile('header3.tex', 'utf8');
        cachedTemplates.projecttem = await fsp.readFile('project.tex', 'utf8');
        cachedTemplates.end = await fsp.readFile('end.tex', 'utf8');
        console.log('Templates loaded and cached successfully.');
    } catch (error) {
        console.error('Error loading LaTeX templates:', error);
    }
};

// Load templates when the server starts
loadTemplates();

app.post('/user/resume', (req, res) => {
    const data = req.body;
    console.log("received at processing", data);
    res.status(200).send("processed successfully");
});

app.post('/generate-pdf', async (req, res) => {
    try {
        const { details, objective, education, experience, projects } = req.body;

        console.log("Received data:");
        console.log("Details:", details);
        console.log("Objective:", objective);
        console.log("Education:", education);
        console.log("Experience:", experience);
        console.log("Projects:", projects);

        // Use cached LaTeX templates instead of reading from disk
        let finalLatex = cachedTemplates.packagestemplate + cachedTemplates.latexTemplate.replace('{{name}}', details.name)
            .replace(/{email}/g, details.email)
            .replace(/{mobile}/, details.mobile)
            .replace('{adress}', `${details.address} ${details.city} ${details.state} ${details.country}`)
            .replace('{github}', details.githubId)
            .replace('{linkedin}', details.linkedinId)
            + cachedTemplates.objectivetemplate.replace('{objective}', objective.obj)
            + cachedTemplates.header1;

        // Process education
        if (education) {
            education.arr.forEach(ed => {
                let edu = cachedTemplates.educationtem.replace('{institute}', ed.title)
                    .replace('{location}', ed.location)
                    .replace('{degree}', ed.degree)
                    .replace('{start}', ed.startDate)
                    .replace('{cgpa}', ed.cgpa)
                    .replace('{end}', ed.endDate);
                finalLatex += edu;
            });
        }

        finalLatex += cachedTemplates.footer + cachedTemplates.header2;

        // Process experience
        if (experience) {
            experience.arr.forEach(ex => {
                let fullDes = ex.descriptionArray.map(des => "\\item " + des).join('\n');
                let exp = cachedTemplates.experiencetem.replace("{company}", ex.title)
                    .replace("{location}", ex.location)
                    .replace("{start}", ex.startDate)
                    .replace("{end}", ex.endDate)
                    .replace("{description}", fullDes)
                    .replace("{title}", ex.subtitle);
                finalLatex += exp + "\n";
            });
        }

        finalLatex += cachedTemplates.footer + cachedTemplates.header3;

        // Process projects
        if (projects) {
            projects.arr.forEach(pr => {
                let fullDes = pr.descriptionArray.map(des => "\\item " + des).join('\n');
                let proj = cachedTemplates.projecttem.replace("{description}", fullDes)
                    .replace("{title}", pr.title)
                    .replace('breif', pr.brief)
                    .replace('{tools}', pr.tools)
                    .replace("{github}", pr.github);
                finalLatex += proj;
            });
        }

        finalLatex += cachedTemplates.footer + cachedTemplates.end;

        // Generate PDF in-memory without saving to disk
        const input = new Readable();
        input.push(finalLatex);
        input.push(null); // Signal the end of the stream

        const pdf = latex(input);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=resume.pdf');

        pdf.pipe(res);

        pdf.on('error', err => {
            console.error('Error generating PDF:', err);
            res.status(500).send('Error generating PDF');
        });
    } catch (err) {
        console.error('Error in /generate-pdf:', err);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
