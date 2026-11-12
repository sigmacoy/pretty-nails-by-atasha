const fs = require("fs");
const { JSDOM } = require("/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/worker_m3/node_modules/jsdom");
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

const filePath = "/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/DIAGRAMS/use-case-diagram.txt";
const content = fs.readFileSync(filePath, "utf8");

let passed = true;
function assert(cond, msg) {
    if (!cond) {
        console.error("FAIL:", msg);
        passed = false;
    } else {
        console.log("PASS:", msg);
    }
}

// 1. Consolidation check
assert(!/\bUC12\b/.test(content), "UC12 is completely removed");
assert(!/\bUC10\b/.test(content), "UC10 is completely removed");
assert(content.includes("UC4[\"UC4: View Available Dates\"]"), "UC4 correctly declared with View Available Dates");
assert(content.includes("UC5[\"UC5: View Active Services\"]"), "UC5 correctly declared with View Active Services");

// Check package placement
const availBlock = content.match(/subgraph Availability\["Availability Management"\]([\s\S]*?)end/);
assert(availBlock && availBlock[1].includes("UC4"), "UC4 placed under Availability Management");
assert(availBlock && !availBlock[1].includes("UC12"), "UC12 not in Availability Management");

const servBlock = content.match(/subgraph Service\["Service Management"\]([\s\S]*?)end/);
assert(servBlock && servBlock[1].includes("UC5"), "UC5 placed under Service Management");
assert(servBlock && !servBlock[1].includes("UC10"), "UC10 not in Service Management");

const bookBlock = content.match(/subgraph Booking\["Booking Management"\]([\s\S]*?)end/);
assert(bookBlock && !/\bUC4\b/.test(bookBlock[1]), "UC4 removed from Booking Management");
assert(bookBlock && !/\bUC5\b/.test(bookBlock[1]), "UC5 removed from Booking Management");

// 2. Actor mapping check
assert(/Public\s*-->\s*UC1\b/.test(content), "Public connects to UC1");
assert(/Public\s*-->\s*UC2\b/.test(content), "Public connects to UC2");
assert(/Public\s*-->\s*UC4\b/.test(content), "Public connects to UC4");
assert(/Public\s*-->\s*UC5\b/.test(content), "Public connects to UC5");
assert(/Public\s*-->\s*UC14\b/.test(content), "Public connects to UC14");

assert(!/Customer\s*-->\s*UC1\b/.test(content), "Customer does NOT connect to UC1");
assert(!/Customer\s*-->\s*UC2\b/.test(content), "Customer does NOT connect to UC2");
assert(/Customer\s*-->\s*UC3\b/.test(content), "Customer connects to UC3");
assert(/Customer\s*-->\s*UC4\b/.test(content), "Customer connects to UC4");
assert(/Customer\s*-->\s*UC5\b/.test(content), "Customer connects to UC5");

// 3. Include/extend stereotypes and directions
assert(content.includes("UC9 -.->|\"<<extend>>\"| UC8"), "UC9 extends UC8 correctly formatted");
assert(content.includes("UC13 -.->|\"<<include>>\"| UC4"), "UC13 includes UC4 correctly formatted");
assert(content.includes("UC15 -.->|\"<<include>>\"| UC14"), "UC15 includes UC14 correctly formatted");
assert(content.includes("UC19 -.->|\"<<extend>>\"| UC18"), "UC19 extends UC18 correctly formatted");

// Removed pseudo-dependencies
assert(!content.includes("UC4 -.-> UC12"), "UC4 -.-> UC12 removed");
assert(!content.includes("UC5 -.-> UC10"), "UC5 -.-> UC10 removed");
assert(!content.includes("UC20 -.-> UC21"), "UC20 -.-> UC21 removed");
assert(!content.includes("UC22 -.-> UC16"), "UC22 -.-> UC16 removed");
assert(!content.includes("UC22 -.-> UC17"), "UC22 -.-> UC17 removed");
assert(!content.includes("UC22 -.-> UC18"), "UC22 -.-> UC18 removed");
assert(!content.includes("UC22 -.-> UC19"), "UC22 -.-> UC19 removed");

// Mermaid engine parse validation
const path = "/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/.agents/teamwork/worker_m3/node_modules/mermaid/dist/mermaid.esm.min.mjs";
import(path).then(async (m) => {
    try {
        const result = await m.default.parse(content);
        assert(!!result, "Mermaid parser parsed file with zero errors");
    } catch (e) {
        assert(false, "Mermaid parse failed: " + e.message);
    }
    if (!passed) process.exit(1);
    console.log("ALL VERIFICATION CHECKS PASSED!");
});
