const core = require('@actions/core');
const fs = require('fs');
const xml2js = require('xml2js');
const axios = require('axios');

async function run() {
    try {
        // Step 1: Get the path to the pom.xml file
        const pomPath = core.getInput('pom-path') || './pom.xml';

        // Step 2: Check if the pom.xml file exists
        if (!fs.existsSync(pomPath)) {
            core.setFailed(`The file ${pomPath} does not exist.`);
            return;
        }

        // Step 3: Read and parse the pom.xml
        const pomData = fs.readFileSync(pomPath, 'utf-8');
        const parser = new xml2js.Parser();
        const parsedPom = await parser.parseStringPromise(pomData);

        // Debugging: Log the parsed POM structure
        core.info('Parsed POM structure:');
       // core.info(JSON.stringify(parsedPom, null, 2));

        // Step 4: Check if dependencies exist
        const dependencies = parsedPom.project.dependencies?.[0]?.dependency;
        if (!dependencies || dependencies.length === 0) {
            core.info('No dependencies found in the pom.xml.');
            return;
        }

        core.info('Dependencies found:');
        for (const dep of dependencies) {
            const groupId = dep.groupId?.[0] || 'Unknown';
            const artifactId = dep.artifactId?.[0] || 'Unknown';
            const version = dep.version?.[0] || 'Unknown';
            const gav = `${groupId}:${artifactId}:${version}`;

            core.info(`Dependency: ${gav}`);

            // Step 5: Fetch CVE-IDs via API
            const cveApiUrl = `http://35.211.68.143:8086/api/cve/list/${gav}`;
            try {
                const response = await axios.get(cveApiUrl);
                const cveData = response.data;

                if (cveData && cveData['CVE-IDs'] && cveData['CVE-IDs'].length > 0) {
                    core.info(`CVE-IDs for ${gav}: ${cveData['CVE-IDs'].join(', ')}`);
                } else {
                    core.info(`No CVE-IDs found for ${gav}`);
                }
            } catch (error) {
                core.warning(`Failed to fetch CVE-IDs for ${gav}: ${error.message}`);
            }
        }

    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
