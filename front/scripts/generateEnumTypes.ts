import fs from "fs";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.fcr-inc.org";
const AUTH = "Basic " + Buffer.from("jim:intentionallyInsecurePassword#3").toString("base64");

async function main() {
    const res = await fetch(`${API_URL}/enums`, {
        headers: { Authorization: AUTH }
    });
    const enums: Record<string, string[]> = await res.json();

    let output = "// AUTO-GENERATED — do not edit manually\n\n";

    for (const [field, values] of Object.entries(enums)) {
        const typeName = field.charAt(0).toUpperCase() + field.slice(1);
        const union = values.map((v) => `"${v}"`).join(" | ");
        output += `export type ${typeName} = ${union};\n\n`;
    }

    output += `export interface CarEnums {\n`;
    for (const field of Object.keys(enums)) {
        const typeName = field.charAt(0).toUpperCase() + field.slice(1);
        output += `    ${field}: ${typeName}[];\n`;
    }
    output += `}\n`;

    fs.writeFileSync("app/types/CarEnums.ts", output);
    console.log("Generated CarEnums.ts");
}

main();
