const trackingButton = document.getElementById('tracking-button');
const latitudeElement = document.getElementById('latitude');
const longitudeElement = document.getElementById('longitude');
const altitudeElement = document.getElementById('altitude');
const errorMessage = document.getElementById('error-message');
const instructionMessage = document.getElementById('instruction-message');

let trackingInterval;
let isTracking = false; // To keep track of the tracking state

// Handle click and double-click events for starting and stopping tracking
trackingButton.addEventListener('click', () => {
    if (!isTracking) {
        requestLocationPermission();
    }
});

trackingButton.addEventListener('dblclick', () => {
    if (isTracking) {
        stopTracking();
    }
});

// Function to request location permission
function requestLocationPermission() {
    // Display an instruction message
    instructionMessage.innerText = "Please allow location access when prompted.";

    // Start tracking location
    startTracking();
}

// Function to start tracking location
function startTracking() {
    if (navigator.geolocation) {
        isTracking = true;
        trackingButton.disabled = true;
        trackingButton.innerText = "Tracking...";
        errorMessage.style.display = "none"; // Hide error message if any
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
    if (altitude !== null && altitudeAccuracy !== null) {
        if (altitudeAccuracy < 30) { // Consider 30 meters as a threshold for accuracy
            altitudeElement.innerText = `${altitude.toFixed(2)} meters (±${altitudeAccuracy.toFixed(2)} meters)`;
        } else {
            altitudeElement.innerText = 'Altitude available but inaccurate';
        }
    } else {
        altitudeElement.innerText = 'Altitude not available';
    }

    // Clear any instruction message once location is successfully retrieved
    instructionMessage.innerText = "";
}

// Function to handle errors in obtaining location
function showError(error) {
    let message = "";
    switch (error.code) {
        case error.PERMISSION_DENIED:
            message = "User denied the request for Geolocation.";
            instructionMessage.innerText = "Location access is needed to show your current position. Please enable location services in your device settings and refresh the page.";
            break;
        case error.POSITION_UNAVAILABLE:
            message = "Location information is unavailable.";
            instructionMessage.innerText = "Could not retrieve location information. Please ensure your device supports geolocation.";
            break;
        case error.TIMEOUT:
            message = "The request to get user location timed out.";
            instructionMessage.innerText = "The request timed out. Please try again.";
            break;
        case error.UNKNOWN_ERROR:
            message = "An unknown error occurred.";
            instructionMessage.innerText = "An unknown error occurred. Please try again later.";
            break;
    }

    // Display error message
    errorMessage.innerText = message;
    errorMessage.style.display = "block";

    // Stop tracking if an error occurs
    stopTracking();
}
