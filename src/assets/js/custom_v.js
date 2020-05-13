   function openNav() {
  document.getElementById("mySidenav").style.width = "387px";
/* document.getElementById("overlay").style.display = "block";
document.body.style.overflow = 'hidden'; */

}

function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
  document.getElementById("overlay").style.display = "none";
  document.body.style.overflow = 'auto';

}
 $(document).ready(function(){ 
        $("#myTab a").click(function(e){
            e.preventDefault();
            $(this).tab('show');
        });
    });