const fs = require('fs');
const parseString = require('xml2js').parseString;

// Function to extract DHCP static leases from OPNsense XML backup
function extractDHCPStaticLeases(backupFilePath) {
    try {
        const xmlData = fs.readFileSync(backupFilePath, 'utf8');
        let dhcpStaticLeases = [];

        parseString(xmlData, (err, result) => {
            if (err) {
                console.error('Error parsing XML:', err);
                return;
            }

            const leases = result.opnsense.dhcpd[0].lan[0].staticmap;
            dhcpStaticLeases = leases.map(lease => {
                const mac = lease.mac ? lease.mac[0] : '';
                const ip = lease.ipaddr ? lease.ipaddr[0] : '';
                const hostname = lease.hostname ? lease.hostname[0] : '';
                return { mac, ip, hostname };
            });
        });

        return dhcpStaticLeases;
    } catch (err) {
        console.error('Error reading OPNsense backup file:', err);
        return [];
    }
}

// Function to format DHCP static leases for OpenWrt
function formatForOpenWrt(leases) {
    return leases.map(lease => {
        let entry = `config host\n`;
        entry += `        list mac '${lease.mac}'\n`;
        entry += `        option ip '${lease.ip}'\n`;
        if (lease.hostname) {
            entry += `        option name '${lease.hostname}'\n`;
        }
        entry += '\n'; // Blank line
        return entry;
    }).join('');
}

// Main function
function main() {
    const opnsenseBackupFile = 'opnsense_backup_file.xml';
    const outputFileName = 'openwrt_static_leases.conf';

    const dhcpStaticLeases = extractDHCPStaticLeases(opnsenseBackupFile);
    const openWrtFormattedLeases = formatForOpenWrt(dhcpStaticLeases);

    // Write to output file
    fs.writeFileSync(outputFileName, openWrtFormattedLeases);
    console.log(`Static leases exported to ${outputFileName}`);
}

// Run the main function
main();
