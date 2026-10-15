"use strict";

(function () {
  const toastDefaults = {
      duration: 4000,
      showClose: true,
      showProgress: true,
      position: "top-right"
    },
    toastIcons = {
      success: "<i class=\"fas fa-check\"></i>",
      error: "<i class=\"fa fa-times\"></i>",
      warning: "<i class=\"fa fa-exclamation-triangle\"></i>",
      info: "<i class=\"fa fa-exclamation-circle\"></i>"
    };
  function buildToast(type, title, message, options) {
    const settings = $.extend({}, toastDefaults, options),
      toastId = "toast_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
      html = "<div class=\"toast " + type + "\"id=\"" + toastId + "\"><div class=\"toast-icon\">" + (toastIcons[type] || toastIcons.info) + "</div><div class=\"toast-content\">" + (title ? "<div class=\"toast-title\">" + title + "</div>" : "") + "<div class=\"toast-message\">" + message + "</div></div>" + (settings.showClose ? "<button class=\"toast-close\" onclick=\"closeToast('" + toastId + "')\">&times;</button>" : "") + (settings.showProgress ? "<div class=\"toast-progress\"style=\"animation-duration: " + settings.duration + "ms;\"></div>" : "") + "</div>";
    return {
      id: toastId,
      html: html,
      duration: settings.duration
    };
  }
  function showToast(type, title, message, options) {
    const toast = buildToast(type, title, message, options),
      $container = $("#toastContainer");
    if ($container.length === 0) {
      $("body").append("<div class=\"toast-container\" id=\"toastContainer\"></div>");
    }
    $("#toastContainer").append(toast.html);
    const $toast = $("#" + toast.id);
    setTimeout(() => {
      $toast.addClass("show");
    }, 10);
    if (toast.duration > 0) {
      setTimeout(() => {
        closeToast(toast.id);
      }, toast.duration);
    }
    return toast.id;
  }
  window.closeToast = function (toastId) {
    const $toast = $("#" + toastId);
    if ($toast.length) {
      $toast.removeClass("show");
      setTimeout(() => {
        $toast.remove();
      }, 300);
    }
  };
  function isValidEmail(email) {
    var emailPattern;
    emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }
  if (window.location.href.indexOf("/detail/") !== -1) {
    $("body").append(`
	<div class="modal-overlay" id="purchaseModal">
		   <div class="modal-content">
			   <div class="modal-header">
				   <h3 class="modal-title"><i class="fas fa-shopping-bag"></i> 确认订单信息</h3>
				   <button class="close-btn close-modal-btn">×</button>
			   </div>
	
			   <div class="modal-body">
				   <div class="_order-info">
					   <!-- 倒计时 -->
					   <div class="countdown-section">
						   <div class="countdown-title"><i class="fas fa-clock"></i> 请在规定时间内完成支付</div>
						   <div class="countdown-timer" id="countdownTimer">15:00</div>
						   <div class="countdown-hint">订单将在倒计时结束后自动取消</div>
					   </div>
	
					   <!-- 订单摘要 -->
					   <div class="order-summary">
						   <h4 class="summary-title"><i class="fas fa-clipboard-list"></i> 订单详情</h4>
						   <div class="summary-row">
							   <span class="summary-value" id="product_name">-</span>
						   </div>
						   <div class="summary-row">
							   <span class="summary-label">收件邮箱</span>
							   <span class="summary-value" id="summaryEmail">-</span>
						   </div>
						   <div class="summary-row summary-row-clear-bt">
							   <span class="summary-label">支付方式</span>
							   <span class="summary-value" id="summaryPayment">-</span>
						   </div>
						   <div class="summary-row">
							   <span class="summary-label">应付总额</span>
							   <span class="summary-value total" id="summaryTotal">-</span>
						   </div>
					   </div>
				   </div>
	
				   <!-- 支付信息 -->
				   <div class="payment-section">
					   <h4 class="payment-title"><i class="fas fa-money-bill-wave"></i> 支付信息</h4>
					   <div class="address-section">
						   <div class="address-label"><i class="fas fa-wallet"></i> 收款地址</div>
						   <div class="address-value" id="usdtAddress"></div>
						   <button class="copy-btn" data-clipboard-text=""><i class="far fa-copy"></i> 复制</button>
					   </div>
					   <div class="qr-section">
						   <div class="qr-code" id="qr-code"><i class="fas fa-qrcode fa-3x"></i></div>
						   <p style="color: #64748b; font-size: 14px;">请使用支持 <span>USDT-TRC20</span> 的钱包扫码支付</p>
					   </div>
				   </div>
			   </div>
		   </div>
	</div>
	`);
  }
  const $purchaseModal = $("#purchaseModal"),
    $closeModalButtons = $(".close-modal-btn"),
    $copyButtons = $(".copy-btn"),
    $quantityInput = $("#quantity"),
    $decreaseQuantity = $(".quantity-btn.subtract"),
    $increaseQuantity = $(".quantity-btn.increase"),
    $totalPrice = $("#totalPrice"),
    productName = $(".product-d-title").text(),
    unitPrice = parseFloat($totalPrice.data("price"));
  function updateTotalPrice() {
    const quantity = parseInt($quantityInput.val()),
      total = (unitPrice * quantity).toFixed(2);
    $totalPrice.text("$" + total);
  }
  $decreaseQuantity.on("click", function () {
    let currentValue = parseInt($quantityInput.val());
    if (currentValue > 1) {
      $quantityInput.val(currentValue - 1);
      updateTotalPrice();
    }
  });
  $increaseQuantity.on("click", function () {
    let currentValue = parseInt($quantityInput.val());
    if (currentValue < 1000) {
      $quantityInput.val(currentValue + 1);
      updateTotalPrice();
    }
  });
  $quantityInput.on("input", function () {
    let value = parseInt($(this).val());
    if (value < 1) {
      $(this).val(1);
    }
    if (value > 1000) {
      $(this).val(1000);
    }
    updateTotalPrice();
  });
  const $paymentMethods = $(".payment-method");
  $paymentMethods.on("click", function () {
    $paymentMethods.removeClass("selected");
    $(this).addClass("selected");
  });
  const $buyButton = $("#buyBtn");
  let countdownInterval = null;
  $buyButton.on("click", function () {
    const email = $("#email").val(),
      quantity = $("#quantity").val(),
      paymentMethod = $(".payment-method.selected .payment-text").text();
    if (!email || !isValidEmail(email)) {
      $("#email").focus();
      showToast("error", "", "请输入正确的邮箱地址");
      return;
    }
    $("#product_name").text(productName);
    $("#summaryEmail").text(email);
    $("#summaryQuantity").text(quantity);
    $("#summaryPrice").text("$" + unitPrice.toFixed(2));
    $("#summaryPayment").text(paymentMethod);
    $("#summaryTotal").text((unitPrice * quantity).toFixed(2));
    const paymentAddresses = [["USDT-TRC20", "TXdwYhdXxggRucPcCkyzSeF8XA3kQ2nhkg"], ["USDT-ERC20", "0x783355105148716D582085F8D34188bBd810C94F"], ["USDT-BEP20", "0x783355105148716D582085F8D34188bBd810C94F"], ["USDT-Solana", "62cTCw9ACNNRztjd2tcfc4rqvsDYzh11RwtPmctX2Qy2"]],
      selectedAddress = paymentAddresses.find(E => {
        return E[0] === paymentMethod;
      });
    $("#usdtAddress").text(selectedAddress[1]);
    $(".qr-section span").text(paymentMethod);
    $copyButtons.attr("data-clipboard-text", selectedAddress[1]);
    $("#qr-code").empty();
    const qrCode = new QRCodeStyling({
      width: 200,
      height: 200,
      type: "canvas",
      data: selectedAddress[1],
      image: "/static/brovkina/img/" + paymentMethod.toLowerCase() + ".png",
      imageOptions: {
        crossOrigin: "anonymous",
        margin: 5,
        imageSize: 0.3,
        hideBackgroundDots: true
      }
    });
    document.getElementById("qr-code").innerHTML = "";
    qrCode.append(document.getElementById("qr-code"));
    $purchaseModal.addClass("active");
    startCountdown();
    showToast("success", "", "订单创建成功");
  });
  $closeModalButtons.on("click", function () {
    $purchaseModal.removeClass("active");
    stopCountdown();
  });
  $purchaseModal.on("click", function (E) {
    if (E.target === this) {
      $purchaseModal.removeClass("active");
      stopCountdown();
    }
  });
  $copyButtons.click(function () {
    var clipboard;
    if (typeof ClipboardJS !== "undefined") {
      clipboard = new ClipboardJS(".copy-btn");
      clipboard.on("success", function (event) {
        $copyButtons.html("<i class=\"fas fa-check\"></i> 已复制");
        $copyButtons.addClass("copied");
        setTimeout(function () {
          $copyButtons.html("<i class=\"far fa-copy\"></i> 复制");
          $copyButtons.removeClass("copied");
        }, 2000);
        event.clearSelection();
      });
    }
  });
  function startCountdown() {
    stopCountdown();
    let secondsRemaining = 15 * 60;
    const $timer = $("#countdownTimer");
    $timer.removeClass("warning");
    countdownInterval = setInterval(function () {
      if (secondsRemaining <= 0) {
        clearInterval(countdownInterval);
        $purchaseModal.removeClass("active");
        alert("支付时间已到，订单已取消");
        return;
      }
      const minutes = Math.floor(secondsRemaining / 60),
        seconds = secondsRemaining % 60;
      $timer.text(minutes.toString().padStart(2, "0") + ":" + seconds.toString().padStart(2, "0"));
      if (secondsRemaining <= 60) {
        $timer.addClass("warning");
      }
      secondsRemaining--;
    }, 1000);
  }
  function stopCountdown() {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  }
  $(window).on("beforeunload", function () {
    stopCountdown();
  });
  $(function () {
    $(".hamburger").on("click", function () {
      var E;
      E = $(this).attr("aria-expanded") === "true" ? false : true;
      $(this).attr("aria-expanded", E);
      $("#nav-menu").toggleClass("open");
    });
    $(".filter-btn").on("click", function () {
      var N;
      N = $(this).data("category");
      $(".filter-btn").removeClass("active").attr("aria-selected", "false");
      $(this).addClass("active").attr("aria-selected", "true");
      if (N === "all") {
        $(".product-table tbody tr").show();
      } else {
        $(".product-table tbody tr").hide();
        $(".cid-" + N).show();
      }
    });
    $(".faq-question").on("click", function () {
      var N, v, O, W;
      v = $(this).closest(".faq-item");
      W = v.find(".faq-answer");
      N = v.find(".faq-question");
      O = N.attr("aria-expanded") === "true" ? false : true;
      N.attr("aria-expanded", O);
      v.toggleClass("active");
      if (O) {
        W.slideDown(200);
      } else {
        W.slideUp(200);
      }
    });
    $(".faq-item.active .faq-answer").show();
  });
})();
