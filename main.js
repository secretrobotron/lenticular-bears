document.addEventListener('DOMContentLoaded', function (e) {
  var sliceThickness = document.querySelector('#lenticular-thickness').value;
  var imageSelection = document.querySelector('#image-selection');
  var lensContainer = document.querySelector('#lens-container');
  var lensTransform = document.querySelector('#lens-transform');
  var images = Array.prototype.slice.call(imageSelection.querySelectorAll('img'), 0);
  var slider = document.querySelector('.slider');
  var sliderAnimationSpeed = document.querySelector('#slider-animation-speed').value;
  var chosenImages;
  var animationStyleSheet;

  function createCompositeImage() {
    function getSlicedImage(image, offset, frames, thickness) {
      var canvas = document.createElement('canvas');
      var context = canvas.getContext('2d');

      var width = image.naturalWidth;
      var height = image.naturalHeight;

      canvas.width = width;
      canvas.height = height;

      context.fillStyle = 'white';

      context.drawImage(image, 0, 0, width, height);

      for (var i = (offset-2*frames+1)*thickness; i < width; i+=frames*thickness) {
        context.clearRect(i, 0, (frames - 1) * thickness, canvas.height);
      }

      return canvas;
    }
   
    var compositeCanvas = document.querySelector('#composite-canvas');
    compositeCanvas.width = images[0].naturalWidth;
    compositeCanvas.height = images[0].naturalHeight;

    var compositeContext = compositeCanvas.getContext('2d');
    compositeContext.clearRect(0, 0, compositeCanvas.width, compositeCanvas.height);

    chosenImages.forEach(function (image, index) {
      var slicedImage = getSlicedImage(image, index, chosenImages.length, sliceThickness);

      compositeContext.drawImage(slicedImage, 0, 0, compositeCanvas.width, compositeCanvas.height);
    });

    document.querySelector('#composite-image-display').innerHTML = '';
    var compositeCopyImage = document.createElement('img');
    compositeCopyImage.src = compositeCanvas.toDataURL("image/png");
    document.querySelector('#composite-image-display').appendChild(compositeCopyImage);

    console.log('LOL', images[0].naturalWidth);
  }

  function setupSlider() {
    function prepareLenticularLensSliderTemplate(width, offset, thickness) {
      var canvas = document.createElement('canvas');
      var context = canvas.getContext('2d');

      canvas.width = width;
      canvas.height = 1;

      context.fillStyle = 'black';
      context.fillRect(offset, 0, thickness, 1);

      return canvas.toDataURL('image/png');
    }

    function applyLens(element, dataURL) {
      element.style.backgroundImage = 'url(' + dataURL + ')';
    }

    function createNewAnimationStyleSheet (frames, frameWidth) {
      var styleSheet = document.createElement('style');

      var keyframesRule = '' +
        '@keyframes slide {' +
        '  from {left: 0;}' +
        '  to {left: -' + (frames * frameWidth) + 'px;}' +
        '}';

      var sliderAnimationRule = '' +
        '#lens-container .slider.animate {' + 
        '  animation-duration: ' + (frames / sliderAnimationSpeed) + 's;' +
        '  animation-timing-function: steps(' + (frames) + ', end)' +
        '}';

      styleSheet.appendChild(document.createTextNode(sliderAnimationRule));
      styleSheet.appendChild(document.createTextNode(keyframesRule));

      if (animationStyleSheet) {
        document.head.removeChild(animationStyleSheet);
      }

      document.head.appendChild(styleSheet);

      animationStyleSheet = styleSheet;

      return styleSheet.sheet;
    }

    applyLens(slider, prepareLenticularLensSliderTemplate(chosenImages.length*sliceThickness, 0, (chosenImages.length-1)*sliceThickness));

    slider.parentNode.appendChild(slider);

    createNewAnimationStyleSheet(chosenImages.length, sliceThickness);
  }

  function resetSimulation() {
    chosenImages = images.filter(function (image) {
      return !(image.classList.contains('off'));
    });
    createCompositeImage();
    setupSlider();
  }

  function setup() {
    var aspectRatio = images[0].naturalWidth/images[0].naturalHeight;
    var scaleFactor = lensContainer.clientWidth / images[0].naturalWidth;
    lensTransform.style.transform = 'scale(' + scaleFactor + ')';
    
    lensContainer.style.height = images[0].naturalHeight*scaleFactor + 'px';

    lensContainer.addEventListener('mousedown', function(e) {
      e.preventDefault();

      var mouseStartX = e.clientX;
      var sliderStartX = slider.offsetLeft;

      function removeEventListeners() {
        window.removeEventListener('mouseup', removeEventListeners);
        window.removeEventListener('mousemove', onMouseMove);
      }

      function onMouseMove(e) {
        e.preventDefault();
        var newPos = sliderStartX + (e.clientX - mouseStartX);
        slider.style.left = newPos + 'px';
      }

      window.addEventListener('mouseup', removeEventListeners);
      window.addEventListener('mousemove', onMouseMove);
    });

    document.querySelector('#go').addEventListener('click', function (e) {
      slider.classList.add('animate');
    });

    document.querySelector('#stop').addEventListener('click', function (e) {
      slider.classList.remove('animate');
    });

    document.querySelector('#slider-opacity').addEventListener('input', function (e) {
      slider.style.opacity = this.value / 10;
    });

    document.querySelector('#lenticular-thickness').addEventListener('input', function (e) {
      sliceThickness = this.value;
      resetSimulation();
    });

    document.querySelector('#slider-animation-speed').addEventListener('input', function (e) {
      sliderAnimationSpeed = this.value;
      resetSimulation();
    });

    var imageSelectionFunctions = {
      'odd': function () {
        return images.filter(function (image, index) {
          return index % 2 === 0;
        });
      },
      'even': function () {
        return images.filter(function (image, index) {
          return index % 2 === 1;
        });
      },
      'every3rd': function () {
        return images.filter(function (image, index) {
          return index % 3 === 0;
        });
      },
      'random': function () {
        return images.filter(function (image, index) {
          return Math.random() > 0.5;
        });
      },
      'random5': function () {
        var randomIndex = Math.floor(Math.random() * (images.length - 5));
        return images.slice(randomIndex, randomIndex + 5);
      }
    };

    imageSelection.querySelectorAll('button').forEach(function (button) {
      button.addEventListener('click', function (e) {
        if (imageSelectionFunctions[button.getAttribute('data-function')]) {
          var newImages = imageSelectionFunctions[button.getAttribute('data-function')]();

          images.forEach(function (image) {
            if (newImages.indexOf(image) === -1) {
              image.classList.add('off');
            }
            else {
              image.classList.remove('off');
            }
          });

          resetSimulation();
        }
      });
    });

    images.forEach(function (image) {
      image.addEventListener('click', function (e) {
        image.classList.toggle('off');
        resetSimulation();
      });
    });
    resetSimulation();
  }



  var imageLoadInterval = setInterval(function () {
    if (images.filter(function (image) {
      console.log(image.width, image.height);
      return image.naturalWidth > 0 && image.naturalHeight > 0;
    }).length === images.length) {
      console.log('ready', images[0].naturalWidth);
      clearInterval(imageLoadInterval);
      setup();
    }
    else {
      console.log('not ready');
    }
  }, 100);

});
