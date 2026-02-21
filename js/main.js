$(document).ready(function () {
	// Nice Select JS
	$('select').niceSelect();

	// Date Picker JS
	$(function () {
		$("#datepicker").datepicker();
	});

	// AI Diagnosis - تحديث الدالة لتعمل مع الكود الجديد
	$('.check-ai').click(function () {
		$('.result-of-check').show();
		// تحويل المستخدم لصفحة التشخيص الذكي الجديدة
		window.location.href = './html/ai-diagnosis.html';
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
// إخفاء شاشة التحميل فوراً عند تحميل الصفحة
$('.preloader').addClass('preloader-deactivate');

// تأمين إضافي: إخفاء بعد ثانية واحدة في حال لم يعمل الكود أعلاه
setTimeout(function() {
	if ($('.preloader').is(':visible')) {
		$('.preloader').addClass('preloader-deactivate');
	}
}, 1000);

// التأكد من إخفاء preloader عند اكتمال تحميل الصفحة بالكامل
$(window).on('load', function () {
	$('.preloader').addClass('preloader-deactivate');
});