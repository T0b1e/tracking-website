const trackingButton = document.getElementById('tracking-button');
const latitudeElement = document.getElementById('latitude');
const longitudeElement = document.getElementById('longitude');
const altitudeElement = document.getElementById('altitude');

let trackingInterval;
let isTracking = false; // To keep track of the tracking state

// Handle click and double-click events for starting and stopping tracking
trackingButton.addEventListener('click', () => {
    if (!isTracking) {
        startTracking();
    }
});

trackingButton.addEventListener('dblclick', () => {
    if (isTracking) {
        stopTracking();
    }
});

// Function to start tracking location
function startTracking() {
    if (navigator.geolocation) {
        isTracking = true;
        trackingButton.disabled = true;
        trackingButton.innerText = "Tracking...";
        trackingInterval = setInterval(getLocation, 5000);
        setTimeout(() => {
            trackingButton.disabled = false; // Re-enable after a short delay
        }, 300);
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

// Function to stop tracking location
function stopTracking() {
    isTracking = false;
    clearInterval(trackingInterval);
    trackingButton.innerText = "Start Tracking";
    trackingButton.classList.add('stop-tracking');
    setTimeout(() => {
        trackingButton.classList.remove('stop-tracking');
    }, 500);
}

// Function to get the current location
function getLocation() {
    navigator.geolocation.getCurrentPosition(showPosition, showError, {
        enableHighAccuracy: true, // Enable high accuracy for better results
        timeout: 10000,
        maximumAge: 0
    });
}

// Function to display the position data
function showPosition(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const altitude = position.coords.altitude;
    const altitudeAccuracy = position.coords.altitudeAccuracy; // Check altitude accuracy

    latitudeElement.innerText = latitude.toFixed(6);
    longitudeElement.innerText = longitude.toFixed(6);

    // Check if altitude is available and its accuracy is acceptable
    if (altitude !== null && altitudeAccuracy !== null && altitudeAccuracy < 30) {
        altitudeElement.innerText = `${altitude.toFixed(2)} meters (±${altitudeAccuracy.toFixed(2)} meters)`;
    } else {
        altitudeElement.innerText = 'Altitude not available or inaccurate';
    }
}

// Function to handle errors in obtaining location
function showError(error) {
    let message = "";
    switch (error.code) {
        case error.PERMISSION_DENIED:
            message = "User denied the request for Geolocation.";
            break;
        case error.POSITION_UNAVAILABLE:
            message = "Location information is unavailable.";
            break;
        case error.TIMEOUT:
            message = "The request to get user location timed out.";
            break;
        case error.UNKNOWN_ERROR:
            message = "An unknown error occurred.";
            break;
    }
    alert(message);

    // Stop tracking if an error occurs
    stopTracking();
}
