const core = require('@actions/core');
const fs = require('fs');
const xml2js = require('xml2js');
const axios = require('axios'); // For API requests

async function run() {
    try {
        // Step 1: Get the path to the pom.xml file from the input
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

        // Step 4: Extract dependencies
        const dependencies = parsedPom.project.dependencies[0].dependency;
        core.info('Dependencies found:');
        for (const dep of dependencies) {
            const groupId = dep.groupId[0];
            const artifactId = dep.artifactId[0];
            const version = dep.version[0];
            const gav = `${groupId}:${artifactId}:${version}`;

            core.info(`Dependency: ${gav}`);

            // Step 5: Make an API request to fetch CVE-IDs
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
