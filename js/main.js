$(document).ready(function () {
	// Nice Select JS
	$('select').niceSelect();

	// Date Picker JS
	$(function () {
		$("#datepicker").datepicker();
	});

	$('.check-ai').click(function () {
		$('.result-of-check').show()
	});
	$('#photo-upload').change(function (event) {
		var fileName = $(this).val().split('\\').pop();
		$(this).siblings('label').text(fileName);
	});

	// Get the input element and the image element
	const inputElement = $("#file-upload");
	const imageElement = $("#profile-image");

	// When a new image is selected, update the image element with the new image
	inputElement.on("change", function () {
		const file = this.files[0];
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = function () {
			const dataURL = reader.result;
			imageElement.attr("src", dataURL);
		};
	});

	// When the upload button is clicked, trigger the input element to open the file selection dialog
	$("#upload-button").on("click", function () {
		inputElement.click();
	});

});

/*====================
	Preloader JS
======================*/
$(window).on('load', function () {
	$('.preloader').addClass('preloader-deactivate');
});



