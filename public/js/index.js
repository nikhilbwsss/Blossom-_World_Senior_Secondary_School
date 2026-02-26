window.addEventListener("scroll", function() {
    const navbar = document.querySelector(".navbar");
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // HERO-TOUCH STICKY TRIGGER
    // When the scroll position passes the top-bar (approx 95px), make it sticky
    if (scrollTop > 110) {
        navbar.classList.add("navbar-sticky");
        navbar.classList.remove("sticky-top");
    } 
    // When scrolling back to the very top, return to natural scrolling flow
    else {
        navbar.classList.remove("navbar-sticky");
        navbar.classList.add("sticky-top");
    }
}, { passive: true });

// Preserving your sidebar fix for the customer-app project
document.querySelector('.navbar-toggler').addEventListener('click', function() {
    const menu = document.querySelector('#mainNav');
    if (menu.classList.contains('collapsing')) {
        menu.style.transition = "left 0.35s ease-in-out";
    }
});


const blob = document.getElementById("blobPath");

const shapes = [
"M421.5,302Q389,354,335,380Q281,406,225,410Q169,414,116,383Q63,352,60.5,291Q58,230,83.5,174Q109,118,165,90Q221,62,275,74Q329,86,371,128Q413,170,429.5,235Q446,300,421.5,302Z",
"M432.5,296Q395,342,345,373Q295,404,236.5,416.5Q178,429,124,394.5Q70,360,61,298Q52,236,80,180Q108,124,162.5,93Q217,62,273.5,70Q330,78,375,118Q420,158,440,214Q460,270,432.5,296Z",
"M424.5,300Q386,350,332,377Q278,404,223.5,412Q169,420,116.5,388Q64,356,58.5,293Q53,230,82.5,175Q112,120,167,92Q222,64,277,73Q332,82,372.5,123Q413,164,435,217Q457,270,424.5,300Z"
];

let i = 0;
function animateBlob(){
  blob.setAttribute("d", shapes[i]);
  i = (i + 1) % shapes.length;
}
setInterval(animateBlob, 2500);

// Test code for the testimonial carousel
    document.addEventListener('DOMContentLoaded', function () {
        const myCarousel = document.querySelector('#testimonialCarousel');
        const carousel = new bootstrap.Carousel(myCarousel, {
            interval: 3000, // 3 seconds
            ride: 'carousel',
            pause: 'hover' // Slides will pause when the user hovers over them
        });
    });


    document.addEventListener('DOMContentLoaded', function () {
        // Wait for 5 seconds (5000 milliseconds)
        setTimeout(function() {
            var myModal = new bootstrap.Modal(document.getElementById('admissionModal'));
            myModal.show();
        }, 5000);
    });

// This is for increse count automatically from main
    const counters = document.querySelectorAll('.stat-number');
    const speed = 200; // The lower the slower

    const startCounting = (counter) => {
        const updateCount = () => {
            const target = +counter.getAttribute('data-target');
            const count = +counter.innerText.replace(/,/g, ''); // Remove commas to calculate

            // Lower inc means smoother animation
            const inc = target / speed;

            if (count < target) {
                // Add the increment and format with commas
                const nextValue = Math.ceil(count + inc);
                counter.innerText = nextValue.toLocaleString();
                setTimeout(updateCount, 1);
            } else {
                counter.innerText = target.toLocaleString();
            }
        };
        updateCount();
    };

    // Intersection Observer to start animation only when visible
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                startCounting(entry.target);
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));

// Handle nested submenu for desktop and mobile
document.addEventListener('DOMContentLoaded', function () {
    const submenuItems = document.querySelectorAll('.dropdown-submenu');
    
    submenuItems.forEach(item => {
        const toggle = item.querySelector('.dropdown-toggle');
        const submenu = item.querySelector('.dropdown-menu');
        
        if (!toggle || !submenu) return;
        
        // Prevent default link behavior
        toggle.addEventListener('click', function(e) {
            // Only prevent default on desktop (991px+)
            if (window.innerWidth >= 992) {
                e.preventDefault();
                e.stopPropagation();
                
                // Toggle submenu visibility
                const isVisible = submenu.style.visibility === 'visible';
                if (isVisible) {
                    submenu.style.visibility = 'hidden';
                    submenu.style.opacity = '0';
                    submenu.style.pointerEvents = 'none';
                } else {
                    submenu.style.visibility = 'visible';
                    submenu.style.opacity = '1';
                    submenu.style.pointerEvents = 'auto';
                }
            }
        });
        
        // Hover effect on desktop
        if (window.innerWidth >= 992) {
            item.addEventListener('mouseenter', function() {
                submenu.style.visibility = 'visible';
                submenu.style.opacity = '1';
                submenu.style.pointerEvents = 'auto';
            });
            
            item.addEventListener('mouseleave', function() {
                submenu.style.visibility = 'hidden';
                submenu.style.opacity = '0';
                submenu.style.pointerEvents = 'none';
            });
        }
    });
    
    // Close submenu when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown-submenu')) {
            submenuItems.forEach(item => {
                const submenu = item.querySelector('.dropdown-menu');
                if (submenu) {
                    submenu.style.visibility = 'hidden';
                    submenu.style.opacity = '0';
                    submenu.style.pointerEvents = 'none';
                }
            });
        }
    });
});