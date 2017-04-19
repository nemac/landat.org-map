/*
  "logo": {
    "image": "imgs/landat_logo_blue.png",
    "alt": "Logo for the LanDat project",
    "link": "https://landat-dev.nemac.org",
    "location": ["bottom", "right"]
  },
*/

export default function CreateLogo (logodata) {
    if (!logodata.image) return;

    var logoWrapper = createLogoWrapper();
    var logoImage = createLogoImage(logodata);
    var logoLink = logodata.link ? createLogoLink(logodata.link) : null;

    if (logoLink) {
        logoLink.appendChild(logoImage);
        logoWrapper.appendChild(logoLink);
    } else {
        logoWrapper.appendChild(logoImage);
    }

    var insertElement = document.getElementsByClassName(logodata.location)[0];
    var existingChild = insertElement.firstChild;
    insertElement.insertBefore(logoWrapper, existingChild);
}

function createLogoWrapper () {
    var logoWrapper = document.createElement("div");
    d3.select(logoWrapper).classed("project-logo", true);
    return logoWrapper;
}

function createLogoImage (logodata) {
    var logoImage = document.createElement("img");
    logoImage.setAttribute("src", logodata.image);
    if (logodata.label) {
        logoImage.setAttribute("alt", logodata.label);
        logoImage.setAttribute("title", logodata.label);
    }
    return logoImage;
}

function createLogoLink (link) {
    var logoLink = document.createElement("a");
    logoLink.setAttribute("href", link);
    logoLink.setAttribute("target", "_blank");

    logoLink.addEventListener('click', function () {

      //send google analytics for clicking logo
      ga('send', 'event', {
        eventCategory: 'map',
        eventAction: 'click',
        eventLabel: 'landat logo',
        nonInteraction: false
      });
    });

    return logoLink;
}
