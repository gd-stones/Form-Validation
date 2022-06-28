function Validator(formSelector) {
    _this = this;
    var formRules = {};

    function getParent(element, selector) {
        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement
            }
            element = element.parentElement
        }
    }

    /**
     * Quy ước tạo rule: 
     * - Nếu có lỗi thì return `error message`
     * - Nếu ko có lỗi thì return `undefinded`
     */
    var validatorRules = {
        required: function(value) {
            return value ? undefined : 'Vui lòng nhập trường này'
        },
        email: function(value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : 'Vui lòng nhập email'
        },
        min: function(min) {
            return function(value) {
                return value.length >= min ? undefined : `Mật khẩu tối thiểu ${min} ký tự`
            }
        }
    }

    // Lấy ra form element trong DOM theo `formElement`
    var formElement = document.querySelector(formSelector);

    // Chỉ xử lý khi có element trong DOM
    if (formElement) {
        var inputs = formElement.querySelectorAll('[name][rules]');
        // inputs là 1 nodeList, nó có 1 vài đặc điểm giống array, VD là vòng for/of

        for (var input of inputs) {
            var rules = input.getAttribute('rules').split('|')
            for (var rule of rules) {
                var isRuleHasValue = rule.includes(':')
                var ruleInfo;

                /* Code theo logic của mình
                var ruleFunc = validatorRules[rule];

                if (isRuleHasValue) {
                    ruleInfo = rule.split(':')
                        // console.log(ruleInfo)
                    rule = ruleInfo[0];
                    ruleFunc = validatorRules[rule];
                    ruleFunc = ruleFunc(ruleInfo[1])

                    // console.log(validatorRules[rule](ruleInfo[1]))
                } */

                if (isRuleHasValue) {
                    ruleInfo = rule.split(':')
                        // console.log(ruleInfo)
                    rule = ruleInfo[0]; // (1)
                }
                /**
                 * Cần đặt ruleFunc ở đây vì rule trong trường hợp rule = min:6 thì khi chạy qua đoạn if bên trên rule = min =>> ruleFunc = validatorRules[min];
                 * Còn nếu đặt ruleFunc = validatorRules[rule]; bên dưới var ruleInfo; để cho gọn thì ban đầu ruleFunc = validatorRules[min:6]; 
                khi chạy qua đoạn if bên trên thì ruleFunc vẫn ko đổi nên sẽ dính lỗi ruleFunc không phải một hàm - 
                bởi có hàm nào của mình là validatorRules[min:6] đâu, chỉ có validatorRules[min] thôi
                 */
                var ruleFunc = validatorRules[rule];

                if (isRuleHasValue) {
                    ruleFunc = ruleFunc(ruleInfo[1])
                }

                // console.log(rule)

                if (Array.isArray(formRules[input.name])) {
                    formRules[input.name].push(ruleFunc);
                } else {
                    // console.log(ruleFunc)
                    formRules[input.name] = [ruleFunc]
                }
            }

            /* input.name và input.getAttribute('rules') đều là để lấy ra phần nằm phía sau name và rules 
            nhưng cái name là 1 attribute hợp lệ của JS (trong thư viện người ta định nghĩa sẵn rồi) nên chỉ cần viết input.name, 
            còn rules là cái mình tự định nghĩa ra, không có trong thư viện nên cú pháp phải là input.getAttribute('rules') 
            formRules[input.name] = input.getAttribute('rules') */


            // Lắng nghe sự kiện để validate: change, blur...
            input.onblur = handleValidate; // Đây chỉ là cú pháp người ta quy định thế thôi (https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onblur)
            input.oninput = handleClearError;

        }

        // Hàm thực hiện validate
        function handleValidate(event) {
            var rules = formRules[event.target.name];
            // console.log(rules)
            var errorMessage

            /* Code cũ
            Đoạn code này dùng some() hay find() thì logic chạy vẫn đúng bởi 2 method này chỉ tìm thấy cái đầu tiên thỏa mãn (=1) là nó break vòng lặp rồi. 
            TH1: không nhập kỳ tự nào_khi gặp hàm required nó sẽ trả về chuỗi thông báo lỗi <=> 1, nên nó sẽ thoát luôn mà ko chạy tới hàm email hay min. 
            TH2: có nhập ký tự nhưng nhập lỗi thì nó khi chạy hàm required sẽ trả về 0, tiếp tục chạy hàm email, khi này sẽ trả về thông báo lỗi <=> 1, lúc này sẽ hiện thông báo lỗi. 
            TH3 là nhập đúng: khi này cả hàm requeried và mail đều trả về undefinded, hàm sẽ thoát bởi hết phần tử
            
            rules.some(function(rule) {
                errorMessage = rule(event.target.value);
                console.log(errorMessage)
                return errorMessage
            }) */

            // Code mới : làm theo cách này thì code rõ nghĩa hơn, đỡ hại não hơn
            for (var rule of rules) {
                errorMessage = rule(event.target.value);
                if (errorMessage) break;
            }

            // console.log(errorMessage)
            // Nếu có lỗi thì hiển thị message lỗi
            if (errorMessage) {
                var formGroup = getParent(event.target, '.form-group')
                if (formGroup) {
                    formGroup.classList.add('invalid')

                    var formMessage = formGroup.querySelector('.form-message')
                    if (formMessage) {
                        formMessage.innerText = errorMessage;
                    }
                }
            }
            return !errorMessage; //Không có lỗi thì trả về true
        }

        // Hàm xóa message lỗi khi người dùng nhập
        function handleClearError(event) {
            var formGroup = getParent(event.target, '.form-group')
            if (formGroup.classList.contains('invalid')) {
                formGroup.classList.remove('invalid')

                var formMessage = formGroup.querySelector('.form-message')
                if (formMessage) {
                    formMessage.innerText = '';
                }
            }
        }
        // console.log(formRules)
    }

    // Xử lý hành vi submit form
    formElement.onsubmit = function(event) {
        event.preventDefault();

        var inputs = formElement.querySelectorAll('[name][rules]');
        var isValid = true;

        for (var input of inputs) {
            // console.log(input.name)
            /* Hàm handleValidate nhận tham số là event, ở đây event tương đương {}_object, 
            câu lệnh đầu tiên của hàm handleValidate là : var rules = formRules[event.target.name]; 
            thì cái event.target ở đây tương đương input. */

            if (!handleValidate({ target: input })) {
                isValid = false;
            }
        }
        // Khi không có lỗi thì submit form
        if (isValid) {
            if (typeof _this.onSubmit === 'function') {

                var enableInputs = formElement.querySelectorAll('[name]:not([disabled])')
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

                // Gọi lại hàm onSubmit và trả về giá trị người dùng nhập vào
                _this.onSubmit(formValues)
            } else {
                formElement.submit()
            }
        }
    }
}