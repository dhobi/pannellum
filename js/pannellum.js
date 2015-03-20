/*
 * Pannellum - An HTML5 based Panorama Viewer
 * Copyright (c) 2011-2012 Matthew Petroff
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
function Pannellum(args) {

    var defaultFor = function (arg, val) {
        return typeof arg !== 'undefined' ? arg : val;
    }
    var _self = this;

    args = defaultFor(args, {});


    var pWidth;
    var pHeight;
    var srcFromElem;
    var titleFromElem;
    var catchKeyInputs = true;
    var gid;

    var licenseType;
    var license;
    var popoutmode = false;
    var fov = defaultFor(args.fov, 70);
    var lat = defaultFor(args.lat, 0);
    var lon = defaultFor(args.lon, 0);

    var camera, renderer;
    var onPointerDownPointerX, onPointerDownPointerY;
    var onPointerDownLon, onPointerDownLat;

    var isUserInteracting = false, phi = 0, theta = 0;

    var keysDown = new Array(10);

    var fullWindowActive = false;
    var loaded = false;
    var error = false;
    var isTimedOut = false;
    var container, mesh, scene;
    var panoimage;
    var panotexture;

    var t1, t2;

    var generateDivId = function () {
        var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
        var string_length = 16;
        var randomstring = '';
        for (var i = 0; i < string_length; i++) {
            var rnum = Math.floor(Math.random() * chars.length);
            randomstring += chars.substring(rnum, rnum + 1);
        }
        gid = randomstring;
    }

    var mustShowZoom = function () {
        return defaultFor(args.showZoom, true);
    }
    var mustShowFullToggle = function () {
        return defaultFor(args.showFullToggle, true);
    }

    var generateZoomHtml = function () {
        if (mustShowZoom()) {
            var zoomControlsElem = document.createElement('div');
            zoomControlsElem.setAttribute('id', 'pannellum_zoomcontrols_' + gid);
            zoomControlsElem.setAttribute('class', 'pannellum_zoomcontrols');

            var zoomControlsIn = document.createElement('div');
            zoomControlsIn.setAttribute('id', 'pannellum_zoom_in_' + gid);
            zoomControlsIn.setAttribute('class', 'pannellum_zoom_in pannellum_sprite');

            var zoomControlsOut = document.createElement('div');
            zoomControlsOut.setAttribute('id', 'pannellum_zoom_out_' + gid);
            zoomControlsOut.setAttribute('class', 'pannellum_zoom_out pannellum_sprite');

            zoomControlsElem.appendChild(zoomControlsIn);
            zoomControlsElem.appendChild(zoomControlsOut);


            return zoomControlsElem;
        }
        return document.createTextNode('');
    }

    var generateFullToggleHtml = function () {
        if (mustShowFullToggle()) {
            var fullWindowToggleButton = document.createElement('div');
            fullWindowToggleButton.setAttribute('id', 'pannellum_fullwindowtoggle_button_' + gid);
            fullWindowToggleButton.setAttribute('class', 'pannellum_fullwindowtoggle_button pannellum_sprite pannellum_fullwindowtoggle_button_inactive');

            return fullWindowToggleButton;
        }
        return document.createTextNode('');
    }

    var checkInitElem = function () {

        if (document.getElementById(args.id) == null) {
            alert("Given id " + args.id + " is not valid!");
            return false;
        }

        try {
            pWidth = defaultFor(args.width, document.getElementById(args.id).width);
        } catch (event) {
            pWidth = args.width;
        }
        try {
            pHeight = defaultFor(args.height, document.getElementById(args.id).height);
        } catch (event) {
            pHeight = args.height;
        }

        try {
            srcFromElem = defaultFor(args.panorama, document.getElementById(args.id).src);
        } catch (event) {
            srcFromElem = args.panorama;
        }

        try {
            titleFromElem = defaultFor(args.title, document.getElementById(args.id).title);
        } catch (event) {
            titleFromElem = defaultFor(args.title,'');
        }
        return true;
    }

    this.newInit = function () {

        if (!checkInitElem()) {
            return;
        }
        generateDivId();

        var pannellumPageElem = document.createElement("div");
        pannellumPageElem.setAttribute('id', 'pannellum_page_' + gid);
        pannellumPageElem.setAttribute('class', 'pannellum_page');


        //////
        var pannellumContainerElem = document.createElement("div");
        pannellumContainerElem.setAttribute('id', 'pannellum_container_' + gid);
        pannellumContainerElem.setAttribute('class', 'pannellum_container');

        /////
        var pannellumNoScriptElem = document.createElement("noscript");
        var pannellumNoScriptDiv = document.createElement("div");
        pannellumNoScriptDiv.setAttribute('id', 'pannellum_nojavascript_' + gid);
        pannellumNoScriptDiv.setAttribute('class', 'pannellum_noselect pannellum_nojavascript');
        var pannellumNoScriptP = document.createElement("p");
        var pannellumNoScriptPText = document.createTextNode('Javascript is required to view this panorama.');

        pannellumNoScriptP.appendChild(pannellumNoScriptPText);
        pannellumNoScriptDiv.appendChild(pannellumNoScriptP);
        pannellumNoScriptElem.appendChild(pannellumNoScriptDiv);

        /////
        var pannellumPanoramaInfoDiv = document.createElement("div");
        pannellumPanoramaInfoDiv.setAttribute('id', 'pannellum_panorama_info_' + gid);
        pannellumPanoramaInfoDiv.setAttribute('class', 'pannellum_noselect pannellum_panorama_info');
        var panoramaTitleDiv = document.createElement("div");
        panoramaTitleDiv.setAttribute('id', 'pannellum_title_box_' + gid);
        panoramaTitleDiv.setAttribute('class', 'pannellum_title_box');
        var panoramaAuthorDiv = document.createElement("div");
        panoramaAuthorDiv.setAttribute('id', 'pannellum_author_box_' + gid);
        panoramaAuthorDiv.setAttribute('class', 'pannellum_author_box');

        pannellumPanoramaInfoDiv.appendChild(panoramaTitleDiv);
        pannellumPanoramaInfoDiv.appendChild(panoramaAuthorDiv);

        ///////
        var pannellumLogoElem = document.createElement("div");
        pannellumLogoElem.setAttribute('id', 'pannellum_logo_' + gid);
        pannellumLogoElem.setAttribute('class', 'pannellum_logo pannellum_sprite');

        var pannellumLogoLink = document.createElement("a");
        pannellumLogoElem.setAttribute('href', 'https://bitbucket.org/mpetroff/pannellum/');
        pannellumLogoElem.setAttribute('target', '_blank');
        pannellumLogoElem.appendChild(document.createTextNode(''));

        pannellumLogoElem.appendChild(pannellumLogoLink);

        ///////
        var pannellumLoadBox = document.createElement("div");
        pannellumLoadBox.setAttribute('id', 'pannellum_load_box_' + gid);
        pannellumLoadBox.setAttribute('class', 'pannellum_load_box pannellum_noselect');
        var pannellumLoadBoxP = document.createElement("p");
        pannellumLoadBoxP.appendChild(document.createTextNode('Loading...'));
        var pannellumLoadIndicator = document.createElement("div");
        pannellumLoadIndicator.setAttribute('id', 'pannellum_load_indicator_' + gid);
        pannellumLoadIndicator.setAttribute('class', 'pannellum_load_indicator');

        pannellumLoadBox.appendChild(pannellumLoadBoxP);
        pannellumLoadBox.appendChild(pannellumLoadIndicator);

        ///////
        var pannellumLoadButton = document.createElement("div");
        pannellumLoadButton.setAttribute('id', 'pannellum_load_button_' + gid);
        pannellumLoadButton.setAttribute('class', 'pannellum_load_button noselect');
        var pannellumLoadButtonP = document.createElement("p");
        pannellumLoadButtonP.appendChild(document.createTextNode('Click to load panorama'));

        pannellumLoadButton.appendChild(pannellumLoadButtonP);

        ///////
        var pannellumCanvas = document.createElement("div");
        pannellumCanvas.setAttribute('id', 'pannellum_nocanvas_' + gid);
        pannellumCanvas.setAttribute('class', 'pannellum_nocanvas pannellum_noselect');
        var pannellumCanvasP = document.createElement("p");
        pannellumCanvasP.appendChild(document.createTextNode('Your browser does not have the necessary WebGL support to display this panorama.'));

        pannellumCanvas.appendChild(pannellumCanvasP);

        //////

        var pannellumAbout = document.createElement("div");
        pannellumAbout.setAttribute('id', 'pannellum_about_' + gid);
        pannellumAbout.setAttribute('class', 'pannellum_about');
        pannellumAbout.setAttribute('style', 'display: none;');
        var pannellumAboutA = document.createElement("a");
        pannellumAboutA.setAttribute('href', 'https://bitbucket.org/mpetroff/pannellum/');
        pannellumAboutA.setAttribute('target', '_blank');
        pannellumAboutA.appendChild(document.createTextNode('Pannellum'));

        pannellumAbout.appendChild(pannellumAboutA);

        /////
        pannellumPageElem.appendChild(pannellumContainerElem);
        pannellumPageElem.appendChild(pannellumNoScriptElem);
        pannellumPageElem.appendChild(pannellumPanoramaInfoDiv);
        pannellumPageElem.appendChild(generateZoomHtml());
        pannellumPageElem.appendChild(pannellumLogoElem);
        pannellumPageElem.appendChild(generateFullToggleHtml());
        pannellumPageElem.appendChild(pannellumLoadBox);
        pannellumPageElem.appendChild(pannellumLoadButton);
        pannellumPageElem.appendChild(pannellumCanvas);
        pannellumPageElem.appendChild(pannellumAbout);


        var oldNode = document.getElementById(args.id);
        oldNode.parentNode.replaceChild(pannellumPageElem, oldNode);

        if (mustShowZoom()) {
            document.getElementById('pannellum_zoom_in_' + gid).onclick = function () {
                _self.zoomIn(5);
            }

            document.getElementById('pannellum_zoom_out_' + gid).onclick = function () {
                _self.zoomOut(5);
            }
        }

        document.getElementById('pannellum_load_button_' + gid).onclick = function () {
            _self.load();
        }

        if (mustShowFullToggle()) {
            document.getElementById('pannellum_fullwindowtoggle_button_' + gid).onclick = function () {
                _self.toggleFullWindow()
            }
        }

        document.getElementById('pannellum_page_' + gid).style.width = pWidth + "px";
        document.getElementById('pannellum_page_' + gid).style.height = pHeight + "px";

        initContextmenu();
        initLogo();
        initTitle();
        initAuthor();
        initLicense();
        initPopOut();
        initFallback();
        initFov();
        initLat();
        initLon();
        initAutoLoad();
    }


    var initContextmenu = function () {
        try {
            document.getElementById('pannellum_page_' + gid).addEventListener('contextmenu', onRightClick, false);
        } catch (err) {
            console.log(err)
            // Lack of "about" display is not a big deal
        }
    }

    var initLogo = function () {
        if (defaultFor(args.logo, 'no') == 'yes') {
            document.getElementById('pannellum_logo_' + gid).style.display = 'inline';
        }
    }

    var initTitle = function () {
        if (defaultFor(titleFromElem,'') != '') {
            document.getElementById('pannellum_title_box_' + gid).innerHTML = titleFromElem;
        }
    }

    var initAuthor = function () {
        if (defaultFor(args.author, '') != '') {
            document.getElementById('pannellum_author_box_' + gid).innerHTML = 'by ' + args.author;
        }
    }

    var initLicense = function () {
        var licenseArg = defaultFor(args.license, -1);
        if (licenseArg >= 0) {
            switch (licenseArg) {
                case 0:
                    licenseType = 'by';
                    break;
                case 1:
                    licenseType = 'by-sa';
                    break;
                case 2:
                    licenseType = 'by-nd';
                    break;
                case 3:
                    licenseType = 'by-nc';
                    break;
                case 4:
                    licenseType = 'by-nc-sa';
                    break;
                case 5:
                    licenseType = 'by-nc-nd';
                    break;
            }
            document.getElementById('pannellum_author_box_' + gid).innerHTML += '<a rel="license" target="_blank" href="http://creativecommons.org/licenses/' + licenseType + '/3.0/"><div id="pannellum_license_' + gid + '" class="pannellum_license"></div></a>';
            license = document.getElementById('pannellum_license_' + gid).style;
            license.backgroundImage = "url('http://i.creativecommons.org/l/" + licenseType + "/3.0/80x15.png')";
            license.width = '80px';
        }
    }

    var initPopOut = function () {
        if (defaultFor(args.popout, 'no') == 'yes') {
            document.getElementById('pannellum_fullwindowtoggle_button_' + gid).classList.add('pannellum_fullwindowtoggle_button_active');
            popoutmode = true;
        }
    }


    var initFallback = function () {
        if (defaultFor(args.fallback, '') != '') {
            document.getElementById('pannellum_nocanvas_' + gid).innerHTML = '<p>Your browser does not support WebGL.<br><a href="' + args.fallback + '" target="_blank">Click here to view this panorama in an alternative viewer.</a></p>';
        }
    }

    var initFov = function () {
        fov = defaultFor(args.fov, 70);

        // keep field of view within bounds
        if (fov < 40) {
            fov = 40;
        } else if (fov > 100) {
            fov = 100;
        }
    }

    var initLat = function () {
        lat = defaultFor(args.lat, 0);

        // keep lat within bounds
        if (fov < -85) {
            fov = -85;
        } else if (fov > 85) {
            fov = 85;
        }
    }

    var initLon = function () {
        lon = defaultFor(args.lon, 0);
    }

    var initAutoLoad = function () {
        if (defaultFor(args.autoload, 'no') == 'yes' || defaultFor(args.popoutautoload, 'no') == 'yes') {
            if (defaultFor(args.popoutautoload, 'no') != 'yes') {
                // show loading box
                document.getElementById('pannellum_load_box_' + gid).style.display = 'inline';
            }
            init();
        } else {
            document.getElementById('pannellum_load_button_' + gid).style.display = 'table';
        }
    }


    var init = function () {
        container = document.getElementById('pannellum_container_' + gid);

        camera = new THREE.PerspectiveCamera(fov, pWidth / pHeight, 1, 1100);
        camera.rotation.order = "YXZ";

        scene = new THREE.Scene();
        scene.add(camera);

        panoimage = new Image();
        panotexture = new THREE.Texture(panoimage);
        panoimage.onload = function () {
            panotexture.needsUpdate = true;
            panotexture.minFilter = THREE.NearestFilter;
            mesh = new THREE.Mesh(
                new THREE.SphereGeometry(500, 60, 40),
                new THREE.MeshBasicMaterial({map:panotexture})
            );
            mesh.scale.x = -1;
            try {
                scene.add(mesh);
            } catch (err) {
                // show error message if canvas is not supported
                console.log(err)
                anError();
            }

            try {
                renderer = new THREE.WebGLRenderer();
                renderer.setSize(pWidth, pHeight);
                //renderer.initWebGLObjects(scene);
            } catch (err) {
                // show error message if WebGL is not supported
                console.log(err)
                anError();
            }

            container.appendChild(renderer.domElement);

            var newPannellumPage = document.getElementById('pannellum_page_' + gid);

            newPannellumPage.onmouseover = function () {
                catchKeyInputs = true;
            }

            newPannellumPage.onmouseout = function () {
                catchKeyInputs = false;
            }

            newPannellumPage.addEventListener('mousedown', onDocumentMouseDown, false);
            newPannellumPage.addEventListener('mousemove', onDocumentMouseMove, false);
            newPannellumPage.addEventListener('mouseup', onDocumentMouseUp, false);
            newPannellumPage.addEventListener('mousewheel', onDocumentMouseWheel, false);
            newPannellumPage.addEventListener('DOMMouseScroll', onDocumentMouseWheel, false);
            newPannellumPage.addEventListener('onresize', onDocumentResize, false);
            newPannellumPage.addEventListener('mozfullscreenchange', onFullScreenChange, false);
            newPannellumPage.addEventListener('webkitfullscreenchange', onFullScreenChange, false);
            newPannellumPage.addEventListener('fullscreenchange', onFullScreenChange, false);
            newPannellumPage.addEventListener('mozfullscreenerror', fullScreenError, false);
            newPannellumPage.addEventListener('webkitfullscreenerror', fullScreenError, false);
            newPannellumPage.addEventListener('fullscreenerror', fullScreenError, false);
            window.addEventListener('resize', onDocumentResize, false);
            document.addEventListener('keydown', onDocumentKeyPress, false);
            document.addEventListener('keyup', onDocumentKeyUp, false);
            window.addEventListener('blur', clearKeys, false);
            newPannellumPage.addEventListener('mouseout', onDocumentMouseUp, false);
            newPannellumPage.addEventListener('touchstart', onDocumentTouchStart, false);
            newPannellumPage.addEventListener('touchmove', onDocumentTouchMove, false);
            newPannellumPage.addEventListener('touchend', onDocumentTouchEnd, false);

            renderInit();
            var t = setTimeout(function () {
                isTimedOut = true
            }, 500);

            setInterval(function () {
                keyRepeat();
            }, 20);
        };

        panoimage.src = srcFromElem;

        document.getElementById('pannellum_page_' + gid).className = 'pannellum_page pannellum_grab';

        if (defaultFor(args.rotation, 'undefined') != 'undefined') {
            if (defaultFor(args.rotation.direction, 'left') == 'left') {
                setInterval(function () {
                    rotate(-defaultFor(args.rotation.speed, 0.5));
                }, 25);
            } else {
                setInterval(function () {
                    rotate(defaultFor(args.rotation.speed, 0.5));
                }, defaultFor(args.rotation.timeout, 25));
            }

        }
    }

    var rotate = function (direction) {
        if (!isUserInteracting) {
            for (var i = 0; i < 11; i++) {
                if (keysDown[i]) {
                    return;
                }
            }

            lon += direction;
            animate();
        }
    }

    var anError = function () {
        document.getElementById('pannellum_load_box_' + gid).style.display = 'none';
        document.getElementById('pannellum_nocanvas_' + gid).style.display = 'table';
        error = true;
    }

    var onRightClick = function (event) {
        var aboutElem = document.getElementById('pannellum_about_' + gid);
        var pageElem = document.getElementById('pannellum_page_' + gid);

        aboutElem.style.marginLeft = (event.pageX - pageElem.offsetLeft + 5) + 'px';
        aboutElem.style.marginTop = (event.pageY - pageElem.offsetTop + 5) + 'px';
        clearTimeout(t1);
        clearTimeout(t2);
        aboutElem.style.display = 'block';
        aboutElem.style.opacity = 1;
        t1 = setTimeout(function () {
            aboutElem.style.opacity = 0;
        }, 2000);
        t2 = setTimeout(function () {
            aboutElem.style.display = 'none';
        }, 2500);
        event.preventDefault();
    }

    var onDocumentMouseDown = function (event) {
        // override default action
        event.preventDefault();
        // but not all of it
        window.focus();

        isUserInteracting = true;

        onPointerDownPointerX = event.clientX;
        onPointerDownPointerY = event.clientY;

        onPointerDownLon = lon;
        onPointerDownLat = lat;

        document.getElementById('pannellum_page_' + gid).className = 'pannellum_page pannellum_grabbing';
    }

    var onDocumentMouseMove = function (event) {
        if (isUserInteracting) {
            lon = (onPointerDownPointerX - event.clientX) * 0.1 + onPointerDownLon;
            lat = (event.clientY - onPointerDownPointerY) * 0.1 + onPointerDownLat;
            animate();
        }
    }

    var onDocumentMouseUp = function (event) {
        isUserInteracting = false;
        document.getElementById('pannellum_page_' + gid).className = 'pannellum_page pannellum_grab';
    }

    var onDocumentTouchStart = function (event) {
        onPointerDownPointerX = event.targetTouches[0].clientX;
        onPointerDownPointerY = event.targetTouches[0].clientY;

        onPointerDownLon = lon;
        onPointerDownLat = lat;
    }

    var onDocumentTouchMove = function (event) {
        // override default action
        event.preventDefault();

        lon = (onPointerDownPointerX - event.targetTouches[0].clientX) * 0.1 + onPointerDownLon;
        lat = (event.targetTouches[0].clientY - onPointerDownPointerY) * 0.1 + onPointerDownLat;
        animate();
    }

    var onDocumentTouchEnd = function (event) {
        // do nothing for now
    }

    var onDocumentMouseWheel = function (event) {
        event.preventDefault();
        if (fov >= 35 && fov <= 105) {
            if (event.wheelDeltaY) {
                // WebKit
                fov -= event.wheelDeltaY * 0.05;
            } else if (event.wheelDelta) {
                // Opera / Explorer 9
                fov -= event.wheelDelta * 0.05;
            } else if (event.detail) {
                // Firefox
                fov += event.detail * 1.5;
            }
        }

        // keep field of view within bounds
        if (fov < 35) {
            fov = 35;
        } else if (fov > 105) {
            fov = 105;
        }
        camera.fov = fov;
        camera.aspect = pWidth / pHeight;
        camera.near = 1;
        camera.far = 1100;
        camera.updateProjectionMatrix ();
        render();
    }

    var onDocumentKeyPress = function (event) {
        if (catchKeyInputs) {
            // override default action
            event.preventDefault();

            // record key pressed
            keynumber = event.keycode;
            if (event.which) {
                keynumber = event.which;
            }

            // if minus key is pressed
            if (keynumber == 109 || keynumber == 189 || keynumber == 17) {
                keysDown[0] = true;
            }

            // if plus key is pressed
            if (keynumber == 107 || keynumber == 187 || keynumber == 16) {
                keysDown[1] = true;
            }


            // if escape key is pressed
            if (keynumber == 27) {
                // if in full window / popout mode
                if (fullWindowActive == true || popoutmode == true) {
                    _self.toggleFullWindow();
                }
            }

            // if up arrow is pressed
            if (keynumber == 38) {
                keysDown[2] = true;
            }
            // if "w" is pressed
            if (keynumber == 87) {
                keysDown[6] = true;
            }

            // if down arrow is pressed
            if (keynumber == 40) {
                keysDown[3] = true;
            }
            // if "s" is pressed
            if (keynumber == 83) {
                keysDown[7] = true;
            }

            // if left arrow is pressed
            if (keynumber == 37) {
                keysDown[4] = true;
            }
            // if "a" is pressed
            if (keynumber == 65) {
                keysDown[8] = true;
            }

            // if right arrow is pressed
            if (keynumber == 39) {
                keysDown[5] = true;
            }
            // if "d" is pressed
            if (keynumber == 68) {
                keysDown[9] = true;
            }
        }
    }

    var clearKeys = function () {
        for (i = 0; i < 10; i++) {
            keysDown[i] = false;
        }
    }

    var onDocumentKeyUp = function (event) {
        if (catchKeyInputs) {
            // override default action
            event.preventDefault();

            // record key released
            keynumber = event.keycode;
            if (event.which) {
                keynumber = event.which;
            }

            // if minus key is released
            if (keynumber == 109 || keynumber == 189 || keynumber == 17) {
                keysDown[0] = false;
            }

            // if plus key is released
            if (keynumber == 107 || keynumber == 187 || keynumber == 16) {
                keysDown[1] = false;
            }

            // if up arrow is released
            if (keynumber == 38) {
                keysDown[2] = false;
            }
            // if "w" is released
            if (keynumber == 87) {
                keysDown[6] = false;
            }

            // if down arrow is released
            if (keynumber == 40) {
                keysDown[3] = false;
            }
            // if "s" is released
            if (keynumber == 83) {
                keysDown[7] = false;
            }

            // if left arrow is released
            if (keynumber == 37) {
                //alert('left arrow released');
                keysDown[4] = false;
            }
            // if "a" is released
            if (keynumber == 65) {
                keysDown[8] = false;
            }

            // if right arrow is released
            if (keynumber == 39) {
                keysDown[5] = false;
            }
            // if "d" is released
            if (keynumber == 68) {
                keysDown[9] = false;
            }
        }
    }

    var keyRepeat = function () {
        // if minus key is down
        if (keysDown[0] == true) {
            _self.zoomOut(1);
        }

        // if plus key is down
        if (keysDown[1] == true) {
            _self.zoomIn(1);
        }

        // if up arrow or "w" is down
        if (keysDown[2] == true || keysDown[6] == true) {
            // pan up
            lat += 1;
            animate();
        }

        // if down arrow or "s" is down
        if (keysDown[3] == true || keysDown[7] == true) {
            // pan down
            lat -= 1;
            animate();
        }

        // if left arrow or "a" is down
        if (keysDown[4] == true || keysDown[8] == true) {
            // pan left
            lon -= 1;
            animate();
        }

        // if right arrow or "d" is down
        if (keysDown[5] == true || keysDown[9] == true) {
            // pan right
            lon += 1;
            animate();
        }
    }

    var onDocumentResize = function () {
        // reset panorama renderer
        try {
            camera.aspect = pWidth / pHeight;
            renderer.setSize(pWidth, pHeight);
            camera.fov = fov;
            camera.aspect = pWidth / pHeight;
            camera.near = 1;
            camera.far = 1100;
            camera.updateProjectionMatrix ();
            render();

            // Kludge to deal with WebKit regression: https://bugs.webkit.org/show_bug.cgi?id=93525
            onFullScreenChange();
        } catch (err) {
            // panorama not loaded
            console.log(err)
        }
    }

    var animate = function () {
        render();
        if (isUserInteracting) {
            //requestAnimationFrame(animate);
        }
    }

    var render = function () {
        try {

            camera.rotation.x = lat * Math.PI / 180;
            camera.rotation.y = -lon * Math.PI / 180;
            camera.rotation.z = 0;

            renderer.render(scene, camera);
        } catch (err) {
            // panorama not loaded
            console.log(err)
        }
    }

    var renderInit = function () {
        try {
            
            if (!isTimedOut) {
                requestAnimationFrame(renderInit);
            } else {
                // hide loading display
                document.getElementById('pannellum_load_box_' + gid).style.display = 'none';
                loaded = true;
                render();
            }
        } catch (err) {
            // panorama not loaded
            console.log(err)
            // display error if there is a bad texture
            if (err == "bad texture") {
                anError();
            }
        }
    }

    this.toggleFullWindow = function () {
        if (loaded && !error) {
            if (!fullWindowActive && !popoutmode) {
                try {

                    pWidth = screen.width;
                    pHeight = screen.height;

                    document.getElementById('pannellum_page_' + gid).style.width = pWidth + "px";
                    document.getElementById('pannellum_page_' + gid).style.height = pHeight + "px";

                    var page = document.getElementById('pannellum_page_' + gid);
                    if (page.requestFullscreen) {
                        page.requestFullscreen();
                    } else if (page.mozRequestFullScreen) {
                        page.mozRequestFullScreen();
                    } else {
                        page.webkitRequestFullScreen();
                    }
                } catch (err) {
                    fullScreenError();
                }
            } else {

                pWidth = defaultFor(args.width, 450);
                pHeight = defaultFor(args.height, 300);

                document.getElementById('pannellum_page_' + gid).style.width = pWidth + "px";
                document.getElementById('pannellum_page_' + gid).style.height = pHeight + "px";

                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } else if (document.webkitCancelFullScreen) {
                    document.webkitCancelFullScreen();
                }

                if (defaultFor(args.popout, 'no') == 'yes') {
                    window.close();
                }
            }
        }
    }

    var onFullScreenChange = function () {
        if (document.fullscreen || document.mozFullScreen || document.webkitIsFullScreen) {
            document.getElementById('pannellum_fullwindowtoggle_button_' + gid).classList.add('pannellum_fullwindowtoggle_button_active');
            fullWindowActive = true;
        } else {
            document.getElementById('pannellum_fullwindowtoggle_button_' + gid).classList.remove('pannellum_fullwindowtoggle_button_active');
            fullWindowActive = false;
        }
    }

    var fullScreenError = function () {
        if (defaultFor(args.popout, 'no') != 'yes') {
            // open new window instead
            var windowspecs = 'width=' + screen.width + ',height=' + screen.height + ',left=0,top=0';
            var windowlocation = window.location.href + '&popout=yes';
            try {
                camera.aspect = pWidth / pHeight;
                windowlocation += '&popoutautoload=yes';
            } catch (err) {
                // panorama not loaded
                console.log(err)
            }
            window.open(windowlocation, null, windowspecs)
        } else {
            window.close();
        }
    }

    this.zoomIn = function (amount) {
        if (fov >= 40) {
            fov -= amount;
            camera.fov = fov;
            camera.aspect = pWidth / pHeight;
            camera.near = 1;
            camera.far = 1100;
            camera.updateProjectionMatrix ();
            render();
        }
        // keep field of view within bounds
        if (fov < 40) {
            fov = 40;
        } else if (fov > 100) {
            fov = 100;
        }
    }

    this.zoomOut = function (amount) {
        if (fov <= 100) {
            fov += amount;
            camera.fov = fov;
            camera.aspect = pWidth / pHeight;
            camera.near = 1;
            camera.far = 1100;
            camera.updateProjectionMatrix ();
            render();
        }
        // keep field of view within bounds
        if (fov < 40) {
            fov = 40;
        } else if (fov > 100) {
            fov = 100;
        }
    }

    this.load = function () {
        document.getElementById('pannellum_load_button_' + gid).style.display = 'none';
        document.getElementById('pannellum_load_box_' + gid).style.display = 'inline';
        init();
    }

    this.newInit();
}