// Đối tượng `Validator`
function Validator(options) {
    // Tạo object này với mục đích lưu tất cả những rule (Validator.isRequired('#fullname'), Validator.isEmail('#email')) 
    // khi hàm forEach chạy xog, để không có rule nào bị ghi đè
    var selectorRules = {};

    // Lấy element của form cần validate
    var formElement = document.querySelector(options.form);
    // console.log(typeof formElement) // là 1 object

    if (formElement) {
        // Khi submit form
        formElement.onsubmit = function(e) {
            e.preventDefault()

            var isFormValid = true;

            // Lặp qua từng rules và validate
            options.rules.forEach(function(rule) {
                var inputElement = formElement.querySelector(rule.selector);
                var isValid = validate(inputElement, rule)
                if (!isValid) {
                    isFormValid = false;
                }
            })

            if (isFormValid) {
                // Trường hợp submit với JS
                if (typeof options.onSubmit === 'function') {
                    // Select tất cả các trường có attribute là name và ko có attribute là disabled
                    var enableInputs = formElement.querySelectorAll('[name]:not([disabled])')
                        // console.log(enableInputs) // Trả về 1 nodeList, mà nodeList thì ko thể dùng được những method() của array
                        // Array.from để chuyển từ nodeList sang array
                    var formValues = Array.from(enableInputs).reduce(function(values, input) {
                        switch (input.type) {
                            case 'checkbox':
                                if (!input.matches(':checked')) { // Nếu ô đó không được check thì trả về object values luôn, không cần thực hiện đoạn code phía dưới cho mệt
                                    values[input.name] = ''
                                    return values;
                                }
                                if (!Array.isArray(values[input.name])) {
                                    values[input.name] = []
                                }
                                values[input.name].push(input.value)
                                break;
                            case 'radio':
                                values[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value
                                    // console.log(formElement.querySelector('input[name="' + input.name + '"]:checked')) // chưa hiểu chỗ 2 dấu + để làm gì
                                break;
                            case 'file':
                                values[input.name] = input.files;
                                break;
                            default:
                                values[input.name] = input.value // input.value : giá trị mà người dùng nhập vào như là tên, mail, pass...
                        }
                        return values
                    }, {})

                    options.onSubmit(formValues);
                }
                // Trường hợp submit với hành vi mặc định
                else {
                    formElement.submit()
                }
            }
        }

        // Lặp qua mỗi rules và xử lý (lắng nghe sự kiện blur, input...)
        options.rules.forEach(function(rule) {

            // Lưu lại rule cho mỗi input, rule.selector : là key, selectorRules[rule.selector] : là 1 cách viết key của object
            // rule.test : là value (cặp key = value của object)
            // Khi chạy lần 1 thì key : rule.selector chưa phải là 1 array nên sẽ chạy đoạn else, khi chạy lần 2 (nếu có) thì rule.selector đã là 1 mảng nên nó sẽ push cái rule.test ở phía sau vào. 
            if (Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.test);
            } else {
                selectorRules[rule.selector] = [rule.test];
            }

            var inputElements = formElement.querySelectorAll(rule.selector);
            Array.from(inputElements).forEach(function(inputElement) {
                if (inputElement) {
                    // Xử lý trường hợp blur khỏi input
                    inputElement.onblur = function() {
                        validate(inputElement, rule)
                    }

                    // Xử lý mỗi khi người dùng nhập vào input => bỏ cái cảnh báo
                    inputElement.oninput = function() {
                        var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector);
                        errorElement.innerText = ''
                        getParent(inputElement, options.formGroupSelector).classList.remove('invalid')
                    }
                }
            })
        });
    }

    function getParent(element, selector) {
        while (element.parentElement) {
            // Cái method() : matches() dùng để kiểm tra xem selector (có thể là class: .class, id: #id) có nằm trong element.parentElement ko 
            if (element.parentElement.matches(selector)) {
                return element.parentElement
            }
            element = element.parentElement
        }
    }

    // Hàm thực hiện validate
    function validate(inputElement, rule) {
        // Từ inputElement lấy thẻ cha của nó, và từ thẻ cha đó lấy ra .form-message
        var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector);

        // console.log(selectorRules); // Trả về toàn bộ object khi blur vào ô bất kỳ
        // console.log(rule.selector); // Trả về key của chính cái ô khi ta click chuột vào ô đó 
        /* Trả về nội dung của mảng (các hàm) của cái ô mà ta click chuột vào
        var rules = selectorRules[rule.selector]
        console.log(rules) */
        var rules = selectorRules[rule.selector]
        var errorMessage
            // Lặp qua từng rules[i] và kiểm tra
        for (var i = 0; i < rules.length; i++) {
            // Input người dùng nhập vào: inputElement.value, test function: rules[i]
            switch (inputElement.type) {
                case 'radio':
                case 'checkbox':
                    errorMessage = rules[i](
                        formElement.querySelector(rule.selector + ':checked')
                    )
                    break;
                default:
                    errorMessage = rules[i](inputElement.value)
            }
            // Nếu có lỗi thì dừng việc kiểm tra
            if (errorMessage) break;
        }

        if (errorMessage) {
            errorElement.innerText = errorMessage;
            getParent(inputElement, options.formGroupSelector).classList.add('invalid')
        } else {
            errorElement.innerText = ''
            getParent(inputElement, options.formGroupSelector).classList.remove('invalid')
        }

        // Trả về true nếu có ko lỗi và ngược lại, ! để convert sang boolean
        return !errorMessage;
    }

}

// Định nghĩa rules
// Nguyên tắc của các rules: 
// 1. Khi có lỗi => trả ra message lỗi 
// 2. Khi hợp lệ => không trả ra cái gì cả (undefined)

Validator.isRequired = function(selector, message) {
    // viết như trên được là bởi vì Validator là 1 hàm-cũng là 1 object,
    // viết như trên tương tự như mình viết ten_bien.onclick = function() ấy,
    // console.log(typeof formElement) // là 1 object
    return {
        selector: selector,
        test: function(value) {
            // mehtod trim() : bỏ đi khoảng trắng ở đầu và cuối input...
            // return value.trim() ? undefined : message || "Vui lòng nhập trường này"
            return value ? undefined : message || "Vui lòng nhập trường này"
        }
    }
}

Validator.isEmail = function(selector, message) {
    return {
        selector: selector,
        test: function(value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : message || 'Nhập đúng email đi!'
        }
    }
}

Validator.minLength = function(selector, min, message) {
    return {
        selector: selector,
        test: function(value) {
            return value.length >= min ? undefined : message || 'Mật khẩu cần nhiều hơn 6 ký tự'
        }
    }
}

Validator.isConfirmed = function(selector, getConfirmValue, message) {
    return {
        selector: selector,
        test: function(value) {
            return value === getConfirmValue() ? undefined : message || 'Giá trị nhập vào không chính xác';
        }
    }
}