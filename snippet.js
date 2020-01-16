
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
    
// Video failover
this.video.play().then(() => {
  console.log("playing")
}).catch(e => {
  console.log(e)
  this.video.muted = true
  this.video.play().catch(e => console.log(e))
})

  // Places content over image target
  const updateTarget = ({detail}) => {
    // When the image target named 'video-target' is detected, play video.
    // This string must match the name of the image target uploaded to 8th Wall.
    if (detail.name === 'video-target') {
      videoObj.position.copy(detail.position)
      videoObj.quaternion.copy(detail.rotation)
      videoObj.scale.set(detail.scale, detail.scale, detail.scale)
      videoObj.visible = true
      video.play()
    }
  }
    
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

        <div id="unmuteButton" style="position:absolute;top:10px;right:10px;z-index: 99;"><img id="unmuteButtonImg" src="./round_volume_off_white_36dp.png" width="35px" height="35px"></div>
