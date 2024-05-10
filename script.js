async function lookupPhoneNumbers(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, phoneNumbers) {
    const results = {};

    for (const phoneNumber of phoneNumbers) {
        const phoneRegex = new RegExp(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im);
        if(!phoneRegex.test(phoneNumber)){
            results[phoneNumber] = false;
            continue;
        }
        const url = `https://lookups.twilio.com/v2/PhoneNumbers/${phoneNumber}`;

        const headers = new Headers();
        headers.append('Authorization', 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`));

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error(`Error for phone number ${phoneNumber}:`, errorData);
                results.push({ error: errorData });
                continue;
            }

            const responseData = await response.json();
            results[phoneNumber] = responseData.valid
        } catch (error) {
            console.error(`Error for phone number ${phoneNumber}:`, error);
            results[phoneNumber] = 'error'
        }
    }
    console.log(results);
    return results;
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('lookupForm').addEventListener('submit', async function (event) {
        event.preventDefault();

        const accountSid = document.getElementById('accountSid').value;
        const authToken = document.getElementById('authToken').value;
        let phoneNumbersInput = document.getElementById('phoneNumbers').value;

        // Remove extra whitespaces and split by commas or new lines
        phoneNumbersInput = phoneNumbersInput.replace(/\s+/g, ' ').trim();
        const phoneNumbers = phoneNumbersInput.split(/[\s,]+/);

        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = 'Loading...';

        const results = await lookupPhoneNumbers(accountSid, authToken, phoneNumbers);

        resultsDiv.innerHTML = '';

        for (const phoneNumber in results) {
            const status = results[phoneNumber] === true ? 'Valid' : results[phoneNumber] === false ? 'Invalid' : 'Error';
            const statusClass = results[phoneNumber] === true ? 'valid' : results[phoneNumber] === false ? 'invalid' : 'error';

            const div = document.createElement('div');
            div.innerHTML = `<strong>${phoneNumber}:</strong> <span class="${statusClass}">${status}</span>`;
            resultsDiv.appendChild(div);
        }

        exportToCsv(results)
    });
})

function exportToCsv(results) {
    let csvContent = "data:text/csv;charset=utf-8,";

    // Add header row
    csvContent += "Phone Number,Status\n";

    // Add data rows
    for (const phoneNumber in results) {
        const status = results[phoneNumber] === true ? 'Valid' : results[phoneNumber] === false ? 'Invalid' : 'Error';
        csvContent += `"${phoneNumber}","${status}"\n`;
    }

    // Create a link element to trigger the download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "phone_number_results.csv");
    document.body.appendChild(link);

    // Trigger the download
    link.click();
}