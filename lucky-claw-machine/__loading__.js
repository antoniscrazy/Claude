pc.script.createLoadingScreen(function (app) {
    app.p = true;

    window.addEventListener('keydown', ev => {
    if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', ' '].includes(ev.key)) {
        ev.preventDefault();
    }
    });
    window.addEventListener('wheel', ev => ev.preventDefault(), { passive: false });

    if (app.p) {
        PokiSDK.init().then(
            () => {
                app.ab = false;
            }
        ).catch(
            () => {
                app.ab = true;
            }
        );

        PokiSDK.gameLoadingStart();
    }

    var showSplash = function () {
        // splash wrapper
        var wrapper = document.createElement('div');
        wrapper.id = 'application-splash-wrapper';
        document.body.appendChild(wrapper);

        // splash
        var splash = document.createElement('div');
        splash.id = 'application-splash';
        wrapper.appendChild(splash);
        splash.style.display = 'none';

        var logo = document.createElement('img');
        logo.src = 'data:image/png;base64,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'
        splash.appendChild(logo);
        logo.onload = function () {
            splash.style.display = 'block';
        };

        var container = document.createElement('div');
        container.id = 'progress-bar-container';
        splash.appendChild(container);

        var bar = document.createElement('div');
        bar.id = 'progress-bar';
        container.appendChild(bar);

    };

    var hideSplash = function () {
        var splash = document.getElementById('application-splash-wrapper');
        splash.parentElement.removeChild(splash);
    };

    var setProgress = function (value) {
        var bar = document.getElementById('progress-bar');
        if(bar) {
            value = Math.min(1, Math.max(0, value));
            bar.style.width = value * 100 + '%';
        }
    };

    var createCss = function () {
        var css = [
            'body {',
            '    background-color: #70a1eb;',
            '}',
            '',
 '#application-splash-wrapper {',
            '    position: absolute;',
            '    top: 0;',
            '    left: 0;',
            '    height: 100%;',
            '    width: 100%;',
          //  '    background: rgb(147,237,255);',
          //  '    background: linear-gradient(0deg, rgba(147,237,255,1) 0%, rgba(0,116,255,1) 100%);',
           'background: ',
'conic-gradient(',
'from 0deg,',
'transparent 0deg,',
'transparent 15deg,',
'rgba(0,116,255,1) 15deg,',
'rgba(0,116,255,1) 30deg,',
'transparent 30deg,',
'transparent 45deg,',
'rgba(0,116,255,1) 45deg,',
'rgba(0,116,255,1) 60deg,',
'transparent 60deg,',
'transparent 75deg,',
'rgba(0,116,255,1) 75deg,',
'rgba(0,116,255,1) 90deg,',
'transparent 90deg,',
'transparent 105deg,',
'rgba(0,116,255,1) 105deg,',
'rgba(0,116,255,1) 120deg,',
'transparent 120deg,',
'transparent 135deg,',
'rgba(0,116,255,1) 135deg,',
'rgba(0,116,255,1) 150deg,',
'transparent 150deg,',
'transparent 165deg,',
'rgba(0,116,255,1) 165deg,',
'rgba(0,116,255,1) 180deg,',
'transparent 180deg,',
'transparent 195deg,',
'rgba(0,116,255,1) 195deg,',
'rgba(0,116,255,1) 210deg,',
'transparent 210deg,',
'transparent 225deg,',
'rgba(0,116,255,1) 225deg,',
'rgba(0,116,255,1) 240deg,',
'transparent 240deg,',
'transparent 255deg,',
'rgba(0,116,255,1) 255deg,',
'rgba(0,116,255,1) 270deg,',
'transparent 270deg,',
'transparent 285deg,',
'rgba(0,116,255,1) 285deg,',
'rgba(0,116,255,1) 300deg,',
'transparent 300deg,',
'transparent 315deg,',
'rgba(0,116,255,1) 315deg,',
'rgba(0,116,255,1) 330deg,',
'transparent 330deg,',
'transparent 345deg,',
'rgba(0,116,255,1) 345deg,',
'rgba(0,116,255,1) 360deg',
'),',
'radial-gradient(circle, rgba(147,237,255,1), rgba(0,116,255,1));',
'background-blend-mode: screen;',
            '}',
            '',
            '#application-splash {',
            '    position: absolute;',
            '    top: calc(30% - 28px);',
            '    width: 264px;',
            '    left: calc(50% - 132px);',
            '}',
            '',
            '#application-splash img {',
            '    width: 100%;',
            '}',
            '',
            '#progress-bar-container {',
            '    margin: 20px auto 0 auto;',
            '    height: 2px;',
            '    width: 100%;',
            '    background-color: #1d292c;',
            '}',
            '',
            '#progress-bar {',
            '    width: 0%;',
            '    height: 100%;',
            '    background-color: #fff;',
            '}',
            '',
            '@media (max-width: 480px) {',
            '    #application-splash {',
            '        width: 170px;',
            '        left: calc(50% - 85px);',
            '    }',
            '}'
        ].join('\n');

        var style = document.createElement('style');
        style.type = 'text/css';
        if (style.styleSheet) {
            style.styleSheet.cssText = css;
        } else {
            style.appendChild(document.createTextNode(css));
        }

        document.head.appendChild(style);
    };

    createCss();
    showSplash();

    app.on('preload:end', function () {
        if (app.p) {
            PokiSDK.gameLoadingFinished();
        }
        app.off('preload:progress');
    });

    app.on('preload:progress', setProgress);
    app.on('start', hideSplash);
});