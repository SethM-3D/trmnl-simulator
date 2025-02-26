var timeoutId = 0;
var frequencyInMs = 15 * 60 * 1000; // 15 mins 

async function toggleFullscreen() {
    const container = document.getElementById('fullscreen-container');
    const button = document.getElementById('fullscreen-btn');
    
    if (!document.fullscreenElement) {
        try {
            container.classList.add('fullscreen-mode');
            await container.requestFullscreen();
            button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="4 14 10 14 10 20"></polyline>
                <polyline points="20 10 14 10 14 4"></polyline>
                <line x1="14" y1="10" x2="21" y2="3"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
            </svg>`;
        } catch (err) {
            console.error('Error attempting to enable fullscreen:', err);
        }
    } else {
        try {
            await document.exitFullscreen();
            container.classList.remove('fullscreen-mode');
            button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 3 21 3 21 9"></polyline>
                <polyline points="9 21 3 21 3 15"></polyline>
                <line x1="21" y1="3" x2="14" y2="10"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
            </svg>`;
        } catch (err) {
            console.error('Error attempting to exit fullscreen:', err);
        }
    }
}

async function setup(server) {
    if (!server) {
        return Promise.reject(new Error('API Server is not set.'));
    }

    // Grab Device ID
    const deviceId = document.getElementById('device-id').value || '';

    if (!deviceId) {
        return Promise.reject(new Error('Device ID is required.'));
    }

    // Grab API Key
    const apiKey = document.getElementById('api-key').value || '';

    if (apiKey) {
        return Promise.resolve(apiKey);
    }

    try {
        const url = new URL('/api/setup', server);
        const resp = await fetch(url, {
            method: 'GET',
            headers: {
                'ID': deviceId
            }
        });

        if (resp.status != 200) {
            return Promise.reject(new Error(`HTTP Status Code (${resp.status}) does indicate success.`))
        }

        const json = await resp.json();

        console.log('Setup:', json);
        if (json['status'] != 200) {
            return Promise.reject(new Error(`API Status Code (${json['status']}) does indicate success.`));
        }

        document.getElementById('screen').src = json['image_url'];
        document.getElementById('api-key').value = json['api_key'];
        return Promise.resolve(json['api_key']);
    } catch (err) {
        return Promise.reject(err);
    }
}

async function display(server, deviceId, key) {
    if (!server) {
        return Promise.reject(new Error('API Server is not set.'));
    }

    if (!key) {
        return Promise.reject(new Error('API Key is not set.'));
    }

    try {
        const url = new URL('/api/display', server);
        const resp = await fetch(url, {
            method: 'GET',
            headers: {
                'ID': deviceId,
                'Access-Token': key,
                'Refresh-Rate': (frequencyInMs / 1000).toFixed()
            }
        });

        if (resp.status != 200) {
            return Promise.reject(new Error(`HTTP Status Code (${resp.status}) does indicate success.`))
        }

        const json = await resp.json();

        console.log('Display:', json);
        if (json['status'] != 0) {
            return Promise.reject(new Error(`API Status Code (${json['status']}) does indicate success.`));
        }

        document.getElementById('screen').src = json['image_url'];
        const frequency = parseInt(json['refresh_rate'], 10);
        if (!isNaN(frequency)) {
            console.log(`Setting refresh frequency to ${frequency} seconds.`);
            frequencyInMs = frequency * 1000;
        }

        return Promise.resolve();
    } catch (err) {
        Promise.reject(err);
    }
}

async function loop(server, deviceId) {
    try {
        const apiKey = await setup(server);
        
        await display(server, deviceId, apiKey);

        timeoutId = 0;
        start(false);
    } catch (err) {
        return Promise.reject(err);
    }
}

function stop() {
    if (!timeoutId) return;
    
    console.log('Stopping...');
    // Cancel any running timeout
    clearTimeout(timeoutId);
    // Set tracker to zero to indicate nothing should be running
    timeoutId = 0;
    // Disable stop button
    document.querySelectorAll('button[type="button"]')[0].disabled = true;
    // Enable start button
    document.querySelectorAll('button[type="button"]')[1].disabled = false;
}

function start(firstRun = true) {
    if (timeoutId) {
        console.log('Already running...');
        return;
    }

    // firstRun should be true only when called by the user clicking the button
    if (firstRun) {
        console.log('Starting...');
        // Enable stop button
        document.querySelectorAll('button[type="button"]')[0].disabled = false;
        // Disable start button
        document.querySelectorAll('button[type="button"]')[1].disabled = true;
    }

    timeoutId = setTimeout(() => {
        if (!timeoutId) {
            return;
        }

        // Grab Server Base URL
        const server = document.getElementById('server').value;

        loop(server).catch((err) => {
            alert(err);
            stop();
        });
    }, firstRun ? 0 : frequencyInMs);
}

// Check for query params on page load
window.onload = function() {}