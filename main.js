let savedLocation = { lat: null, long: null };
let canNavigate = false;
let deviceHeading = 0;
let lastUpdateTime = 0;
let currentLat = 0;
let currentLong = 0;
let currentBearing = 0;
const updateInterval = 100; // Reduced interval for more frequent updates
const arrivalThreshold = 1.0; // Distance threshold in meters for considering "arrived"

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById('location-button').addEventListener('click', function() {
        const button = this;

        if (button.innerText === "Save Location") {
            checkGeolocationPermission(_onGetCurrentLocation);
        } else if (button.innerText === "Navigate" && canNavigate) {
            button.style.display = "none";
            document.getElementById('arrow-container').style.display = "block";

            // Watch position with throttling or debouncing
            navigator.geolocation.watchPosition(function(position) {
                currentLat = position.coords.latitude;
                currentLong = position.coords.longitude;
                updatePosition();
            }, function(error) {
                logToTextarea("Error watching position: " + error.message);
                alert("Failed to update location. Please check your location settings.");
            }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });

            requestOrientationPermission();
        }
    });
});

// Event handler for device orientation
function handleOrientation(event) {
    const alpha = event.alpha;
    let adjustedHeading = alpha;

    if (typeof window.orientation !== 'undefined') {
        switch (window.orientation) {
            case 0:
                adjustedHeading = alpha;
                break;
            case 90:
                adjustedHeading = alpha - 90;
                break;
            case 180:
                adjustedHeading = alpha - 180;
                break;
            case -90:
            case 270:
                adjustedHeading = alpha - 270;
                break;
            default:
                adjustedHeading = alpha;
        }
    }

    deviceHeading = (adjustedHeading + 360) % 360; // Normalize to 0-360
    document.getElementById('compass-heading').textContent = `${deviceHeading.toFixed(0)}°`;
    logToTextarea(`Device orientation: alpha=${event.alpha}, adjustedHeading=${adjustedHeading}, window.orientation=${window.orientation}`);
    updateArrow(currentBearing);
}

// Calculate the bearing and update the arrow position
function updatePosition() {
    const bearing = calculateBearing(currentLat, currentLong, savedLocation.lat, savedLocation.long);
    currentBearing = bearing;
    updateArrow(bearing);
}

// Rotate the arrow smoothly based on bearing
function updateArrow(bearing) {
    const arrowElement = document.getElementById('direction-arrow');
    const adjustedBearing = (bearing - deviceHeading + 360) % 360;
    arrowElement.style.transform = `rotate(${adjustedBearing}deg)`;
    logToTextarea(`Updating arrow: bearing=${bearing}, adjustedBearing=${adjustedBearing}, deviceHeading=${deviceHeading}`);
}

// Function to request orientation permission on iOS
function requestOrientationPermission() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    window.addEventListener('deviceorientation', handleOrientation, true);
                    logToTextarea("Device orientation permission granted.");
                } else {
                    logToTextarea("Device orientation permission denied.");
                    alert("Device orientation access is required for this feature.");
                }
            })
            .catch(console.error);
    } else if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', handleOrientation, true);
        logToTextarea("Device orientation listener added.");
    } else if (window.orientation !== undefined) {
        deviceHeading = window.orientation || 0;
        window.addEventListener('orientationchange', function() {
            deviceHeading = window.orientation || 0;
            logToTextarea(`Orientation changed: window.orientation=${window.orientation}`);
        }, false);
        logToTextarea("Using window.orientation for heading.");
    } else {
        logToTextarea("Device does not support orientation events.");
        alert("Your device does not support orientation events.");
    }
}

function checkGeolocationPermission(callback) {
    if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'geolocation' }).then(function(result) {
            const permission = result.state;
            if (permission === 'granted' || permission === 'prompt') {
                callback();
            } else {
                alert('Location access denied. Please enable location services.');
            }
        });
    } else if (navigator.geolocation) {
        callback();
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

function _onGetCurrentLocation() {
    const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    };
    logToTextarea("Attempting to get current location...");
    navigator.geolocation.getCurrentPosition(function(position) {
        savedLocation.lat = position.coords.latitude;
        savedLocation.long = position.coords.longitude;

        document.getElementById('saved-location-info').innerHTML = 
            `Saved Location: <strong>${savedLocation.lat.toFixed(6)}, ${savedLocation.long.toFixed(6)}</strong>`;

        const button = document.getElementById('location-button');
        button.innerText = "Navigate";
        button.style.backgroundColor = "#007bff";
        button.disabled = true;

        setTimeout(function() {
            canNavigate = true;
            button.disabled = false;
        }, 5000);
    }, function(error) {
        let errorMessage = "Failed to get location. ";
        switch(error.code) {
            case error.PERMISSION_DENIED:
                errorMessage += "User denied the request for Geolocation.";
                break;
            case error.POSITION_UNAVAILABLE:
                errorMessage += "Location information is unavailable.";
                break;
            case error.TIMEOUT:
                errorMessage += "The request to get user location timed out.";
                break;
            case error.UNKNOWN_ERROR:
                errorMessage += "An unknown error occurred.";
                break;
        }
        logToTextarea("Error getting location: " + error.message);
        alert(errorMessage + " Please ensure location services are enabled and refresh the page.");
    }, options);
}

function calculateBearing(currentLat, currentLong, targetLat, targetLong) {
    const dLat = degreesToRadians(targetLat - currentLat);
    const dLon = degreesToRadians(targetLong - currentLong);

    const y = Math.sin(dLon) * Math.cos(degreesToRadians(targetLat));
    const x = Math.cos(degreesToRadians(currentLat)) * Math.sin(degreesToRadians(targetLat)) -
              Math.sin(degreesToRadians(currentLat)) * Math.cos(degreesToRadians(targetLat)) * Math.cos(dLon);
    let bearing = Math.atan2(y, x);
    bearing = radiansToDegrees(bearing);
    return (bearing + 360) % 360; // Normalize to 0-360
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radius of the Earth in meters
    const dLat = degreesToRadians(lat2 - lat1);
    const dLon = degreesToRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
}

function formatDistance(distance) {
    if (distance < 1) {
        return `${(distance * 100).toFixed(2)} cm`; // Display in centimeters
    } else if (distance < 1000) {
        return `${distance.toFixed(2)} m`; // Display in meters
    } else {
        return `${(distance / 1000).toFixed(2)} km`; // Display in kilometers
    }
}

function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
}

function logToTextarea(message) {
    const textarea = document.getElementById('log-textarea');
    if (textarea) {
        textarea.value += message + "\n";
        textarea.scrollTop = textarea.scrollHeight; // Auto-scroll to the bottom
    } else {
        console.warn("Log textarea element not found. Log message:", message);
    }
}
