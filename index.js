// Copyright (c) 2019 8th Wall, Inc.
const imageTargetPipelineModule = () => {
  const videoFile = 'jellyfish-video.mp4'

  let video, videoObj

  // Populates some object into an XR scene and sets the initial camera position. The scene and
  // camera come from xr3js, and are only available in the camera loop lifecycle onStart() or later.
  const initXrScene = ({scene, camera}) => {
    console.log('initXrScene')

    const playButton = document.getElementById('unmuteButton')
    const playButtonImg = document.getElementById('unmuteButtonImg')
    playButton.style.display = 'inline'
    playButton.addEventListener('click', () => { 
      if(this.video.muted) {
        this.videoOverlay.muted = false;
        playButtonImg.src = "./round_volume_up_white_36dp.png"
      } else {
        this.video.muted = true;
        playButtonImg.src = "./round_volume_off_white_36dp.png"
      }
    })

    // Add soft white light to the scene.
    // This light cannot be used to cast shadows as it does not have a direction.
    scene.add(new THREE.AmbientLight(0x404040, 5))

    // Set the initial camera position relative to the scene we just laid out. This must be at a
    // height greater than y=0.
    camera.position.set(0, 3, 0)
  }

  // Places content over image target
  const showTarget = ({detail}) => {
    // When the image target named 'video-target' is detected, play video.
    // This string must match the name of the image target uploaded to 8th Wall.
    if (detail.name === 'video-target') {
      videoObj.position.copy(detail.position)
      videoObj.quaternion.copy(detail.rotation)
      videoObj.scale.set(detail.scale, detail.scale, detail.scale)
      videoObj.visible = true
      // Video failover
      this.video.play().then(() => {
        console.log("playing")
      }).catch(e => {
        console.log(e)
        this.video.muted = true
        this.video.play().catch(e => console.log(e))
      })
    }
  }

  // Hides the image frame when the target is no longer detected.
  const hideTarget = ({detail}) => {
    if (detail.name === 'video-target') {
      video.pause()
      videoObj.visible = false
    }
  }

    // Places content over image target
    const updateTarget = ({detail}) => {
      // When the image target named 'video-target' is detected, play video.
      // This string must match the name of the image target uploaded to 8th Wall.
      if (detail.name === 'video-target') {
        videoObj.position.copy(detail.position)
        videoObj.quaternion.copy(detail.rotation)
        videoObj.scale.set(detail.scale, detail.scale, detail.scale)
        videoObj.visible = true
        // Video failover
        this.video.play().then(() => {
          console.log("playing")
        }).catch(e => {
          console.log(e)
          this.video.muted = true
          this.video.play().catch(e => console.log(e))
        })
      }
    }

  // Grab a handle to the threejs scene and set the camera position on pipeline startup.
  const onStart = ({canvas}) => {
    const {scene, camera} = XR8.Threejs.xrScene()  // Get the 3js scene from XR

    initXrScene({scene, camera}) // Add content to the scene and set starting camera position.

    // Sync the xr controller's 6DoF position and camera paremeters with our scene.
    XR8.XrController.updateCameraProjectionMatrix({
      origin: camera.position,
      facing: camera.quaternion,
    })
  }

  return {
    // Camera pipeline modules need a name. It can be whatever you want but must be
    // unique within your app.
    name: 'threejs-flyer',

    // onStart is called once when the camera feed begins. In this case, we need to wait for the
    // XR8.Threejs scene to be ready before we can access it to add content. It was created in
    // XR8.Threejs.pipelineModule()'s onStart method.
    onStart,

    // Listeners are called right after the processing stage that fired them. This guarantees that
    // updates can be applied at an appropriate synchronized point in the rendering cycle.
    listeners: [
      {event: 'reality.imagefound', process: showTarget},
      {event: 'reality.imageupdated', process: showTarget},
      {event: 'reality.imagelost', process: hideTarget},
    ],
  }
}

// load video before starting AR
const loadVideo = () => {
  // load video for video playback and create videoTexture
  var video = document.createElement('video')
  video.setAttribute('muted' , true)
  video.setAttribute('preload', "auto")
  video.setAttribute('playsinline', true)
  video.muted = true
  video.playsinline = true
  video.autoplay = false
  video.preload = 'auto'
  // Don't autoplay
  // video.play()
  video.oncanplay = () => {
    console.log('video can play')
  }
  
  video.oncanplaythrough = () => {
    console.log('can play through')
    // Open the camera and start running the camera run loop.
    XR8.run({canvas: document.getElementById('camerafeed')})
  }

  video.addEventListener('error', (e) => {
    console.error(`Error loading: ${videoSrc}`, e);
  });

  video.loop = true
  const texture = new THREE.VideoTexture(video)
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.format = THREE.RGBFormat
  texture.crossOrigin = 'anonymous'

  videoObj = new THREE.Mesh(
    new THREE.PlaneGeometry(0.75, 1),
    new THREE.MeshBasicMaterial({map: texture})
  )
  // Hide video until image target is detected.
  videoObj.visible = false
  scene.add(videoObj)
  video.load()
}

const onxrloaded = () => {
  // If your app only interacts with image targets and not the world, disabling world tracking can
  // improve speed.
  XR8.xrController().configure({disableWorldTracking: true})
  XR8.addCameraPipelineModules([  // Add camera pipeline modules.
    // Existing pipeline modules.
    XR8.GlTextureRenderer.pipelineModule(),      // Draws the camera feed.
    XR8.Threejs.pipelineModule(),                // Creates a ThreeJS AR Scene.
    XR8.XrController.pipelineModule(),           // Enables SLAM tracking.
    XRExtras.AlmostThere.pipelineModule(),       // Detects unsupported browsers and gives hints.
    XRExtras.FullWindowCanvas.pipelineModule(),  // Modifies the canvas to fill the window.
    XRExtras.Loading.pipelineModule(),           // Manages the loading screen on startup.
    XRExtras.RuntimeError.pipelineModule(),      // Shows an error image on runtime error.
    // Custom pipeline modules.
    imageTargetPipelineModule(),                  // Draws a frame around detected image targets.
  ])

  // Open the camera and start running the camera run loop.
  loadVideo();
}

// Show loading screen before the full XR library has been loaded.
const load = () => { XRExtras.Loading.showLoading({onxrloaded}) }
window.onload = () => { window.XRExtras ? load() : window.addEventListener('xrextrasloaded', load) }
