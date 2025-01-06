const core = require('@actions/core');
const fs = require('fs');
const xml2js = require('xml2js');

async function run() {
    try {
        // Step 1: Get the path to the pom.xml file from the GitHub Action input
        const pomPath = core.getInput('pom-path') || './pom.xml';

        // Step 2: Check if the pom.xml exists
        if (!fs.existsSync(pomPath)) {
            core.setFailed(`The file ${pomPath} does not exist.`);
            return;
        }

        // Step 3: Read and parse the pom.xml
        const pomData = fs.readFileSync(pomPath, 'utf-8');
        const parser = new xml2js.Parser();
        const parsedPom = await parser.parseStringPromise(pomData);

        // Step 4: Safely extract dependencies
        if (
            parsedPom.project &&
            parsedPom.project.dependencies &&
            parsedPom.project.dependencies[0] &&
            parsedPom.project.dependencies[0].dependency
        ) {
            const dependencies = parsedPom.project.dependencies[0].dependency;
            core.info('Dependencies found:');
            dependencies.forEach(dep => {
                const groupId = dep.groupId ? dep.groupId[0] : 'N/A';
                const artifactId = dep.artifactId ? dep.artifactId[0] : 'N/A';
                const version = dep.version ? dep.version[0] : 'N/A';
                core.info(`${groupId}:${artifactId}:${version}`);
            });
        } else {
            core.setFailed('No dependencies found in the pom.xml.');
        }

    } catch (error) {
        core.setFailed(`Error: ${error.message}`);
    }
}

run();
