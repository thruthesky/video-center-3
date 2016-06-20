<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>WebRTC Peer Connection</title>
    <link href="css/font-awesome/css/font-awesome.min.css" rel="stylesheet">
    <link href="css/bootstrap/css/bootstrap.min.css" rel="stylesheet">
    <link href="css/base.css" rel="stylesheet">
    <link href="css/layout.css" rel="stylesheet">
    <link href="css/module.css" rel="stylesheet">
    <link href="css/module-video.css" rel="stylesheet">
    <link href="css/module-chat.css" rel="stylesheet">
    <link href="css/module-document.css" rel="stylesheet">
    <link href="css/module-whiteboard.css" rel="stylesheet">
    <link href="css/header.css" rel="stylesheet">
    <link href="css/entrance.css" rel="stylesheet">
    <link href="css/lobby.css" rel="stylesheet">
    <link href="css/room.css" rel="stylesheet">
    <link href="css/whiteboard.css" rel="stylesheet">
    <link href="css/footer.css" rel="stylesheet">
    <link href="css/theme.css" rel="stylesheet">
    <style>
        /**
         *
         *  L A Y O U T    : DON'T DESIGN HERE
         *
         */

        #entrance { padding: 2em; }
        #status { background-color: grey; }
        #room { position: relative; background-color:#5f9ea0; }
        #room .content { position: relative; }

        #room .content .whiteboard { display: none; background-color: #e1e1e1; }

        #room.has-whiteboard .whiteboard { display: block; }




        /** White Board Design */
        #room .content .whiteboard {
            position: relative;
            width: 100%;
            height: 340px;
            background-color: #AEBDCC;
        }
        #room .content .whiteboard nav {
            position: absolute;
            z-index: 500;
            top: 4px;
            right: 4px;
        }
        #room .content .whiteboard section { position: absolute; z-index: -50; top: 0; left: 0; right: 0; bottom: 0; }
        #room .content .whiteboard canvas {
            position:relative;
            z-index: 200;
            width:100%;
            height: 100%;
        }

        /** Layout break point */
        @media all and ( min-width: 546px ){
            #room { background-color: #19469D; }
            #room .videos {
                position: absolute;
                z-index: 100;
            }
            #room.has-whiteboard .content .videos {
                position: relative;
                margin: 0;
            }

            #room .content .whiteboard {
                position: absolute;
                z-index: 100;
                top: 0;
                right: 0;
                width: auto;
            }
        }

        #lobby .room-list {
            margin: .4em 0;
        }
        #lobby .room-list .room {
            margin: .1em 0;
            padding: 1em;
            background-color: #5f9ea0;
            color: white;
        }
        #lobby .room-list .room .name {
            display: block;
            font-weight: bold;
            cursor: pointer;
        }

    </style>
    <script>
        var socketURL = '//www.onfis.com:10443';
        var video_count = 0;
        function getScript(src) {
            document.write('<' + 'script src="' + src + '"' +
                    ' type="text/javascript"><' + '/script>');
        }
        var src = socketURL + '/socket.io/socket.io.js';
        getScript( src );
    </script>
</head>
<body>

<div id="videocenter"></div>

<script src="../js/jquery-2.2.3.min.js"></script>
<script src="../js/underscore-min.js"></script>
<script src="../js/underscore.string.min.js"></script>
<script src="../js/js.cookie.js"></script>
<script src="../dist/rmc3.js"></script>
<script src="../dist/rmc3.fbr.js"></script>
<script src="js/functions.js"></script>
<script src="js/rmc-wrapper.js"></script>
<script src="js/socket.js"></script>
<script src="js/element.js"></script>
<script src="js/whiteboard.js"></script>
<script src="js/entrance.js"></script>
<script src="js/lobby.js"></script>
<script src="js/room.js"></script>
<script src="js/chat.js"></script>
<script src="js/client.js"></script>
<script src="css/bootstrap/js/tether.min.js"></script>
<script src="css/bootstrap/js/bootstrap.min.js"></script>
</body>
</html>



