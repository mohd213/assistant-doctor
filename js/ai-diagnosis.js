/**
 * المساعد الطبي - نظام التشخيص الذكي
 * @version 8.0 - نسخة مبسطة تعمل بالكلمات المفتاحية
 */

// ===== إعدادات APIs =====
const APIS = {
    translate: 'https://translate.googleapis.com/translate_a/single',
    openFDA: {
        url: 'https://api.fda.gov/drug/event.json',
        key: '5qpdeD3i6hvw84SfjQhHdYQZEpq7RUQarzrVmk10'
    }
};

// ===== قاعدة محلية بسيطة (نظام كلمات مفتاحية) =====
const LOCAL_DISEASES = [
    {
        keywords: ['صداع', 'حمى', 'سعال', 'زكام'],
        name: 'نزلة برد | Common Cold',
        description: 'عدوى فيروسية تصيب الجهاز التنفسي العلوي.',
        symptoms: 'صداع، حمى، سعال، عطس، احتقان بالأنف.',
        treatment: 'راحة، سوائل دافئة، مسكنات، خافضات حرارة.',
        medications: 'Paracetamol - Ibuprofen - Antihistamines',
        advice: 'اشرب سوائل كثيرة. استشر طبيبك إذا استمرت الحمى.'
    },
    {
        keywords: ['ألم صدر', 'ضيق نفس', 'تعرق', 'دوخة'],
        name: 'ذبحة صدرية | Angina',
        description: 'نقص تدفق الدم والأكسجين إلى عضلة القلب.',
        symptoms: 'ألم أو ضغط في الصدر، ضيق تنفس، تعرق، دوخة.',
        treatment: 'راحة فورية، أكسجين، موسعات شرايين.',
        medications: 'Nitroglycerin - Aspirin - Metoprolol',
        advice: 'اطلب الإسعاف فوراً إذا استمر الألم أكثر من 5 دقائق.'
    },
    {
        keywords: ['يرقان', 'اصفرار', 'تعب', 'بول داكن'],
        name: 'التهاب كبد | Hepatitis',
        description: 'التهاب في خلايا الكبد بسبب فيروس أو دواء.',
        symptoms: 'يرقان، اصفرار الجلد والعينين، تعب شديد، بول داكن.',
        treatment: 'راحة، سوائل، تجنب الكحول، مضادات فيروسية.',
        medications: 'Sofosbuvir - Entecavir - Interferon',
        advice: 'تابع وظائف الكبد بانتظام. تجنب أي دواء بدون استشارة.'
    },
    {
        keywords: ['حمى', 'قشعريرة', 'سعال', 'بلغم'],
        name: 'التهاب رئوي | Pneumonia',
        description: 'عدوى في الأكياس الهوائية للرئة.',
        symptoms: 'حمى، قشعريرة، سعال مع بلغم، ألم صدر.',
        treatment: 'مضادات حيوية، راحة، سوائل، خافضات حرارة.',
        medications: 'Amoxicillin - Azithromycin - Levofloxacin',
        advice: 'أكمل المضاد الحيوي كاملة. تجنب التدخين.'
    },
    {
        keywords: ['غثيان', 'إسهال', 'تقيؤ', 'مغص'],
        name: 'نزلة معوية | Gastroenteritis',
        description: 'التهاب في المعدة والأمعاء بسبب عدوى.',
        symptoms: 'غثيان، إسهال، تقيؤ، مغص، حمى خفيفة.',
        treatment: 'تعويض سوائل، راحة، غذاء خفيف.',
        medications: 'ORS - Ondansetron - Loperamide',
        advice: 'اشرب سوائل كثيرة. راجع طبيبك إذا استمر الإسهال.'
    }
];

// ===== إخفاء شاشة التحميل =====
(function() {
    const preloader = document.querySelector('.preloader');
    if (preloader) {
        setTimeout(() => preloader.classList.add('preloader-deactivate'), 300);
    }
})();

// ===== الكود الرئيسي =====
$(document).ready(function() {
    let isAnalyzing = false;

    $('#analyzeBtn').click(analyzeSymptoms);
    
    $('.symptom-tag').click(function() {
        const symptom = $(this).data('symptom');
        const $input = $('#symptomInput');
        const currentVal = $input.val();
        $input.val(currentVal ? `${currentVal} ${symptom}` : symptom);
        $(this).toggleClass('active');
    });

    $('#symptomInput').keypress(function(e) {
        if (e.which === 13) {
            e.preventDefault();
            analyzeSymptoms();
        }
    });

    async function analyzeSymptoms() {
        const symptoms = $('#symptomInput').val().trim();
        if (!symptoms) return showError('الرجاء إدخال الأعراض أولاً');
        if (isAnalyzing) return;

        toggleLoading(true);
        $('#resultsContainer').empty();

        try {
            // 1. تقسيم الأعراض إلى كلمات
            const symptomWords = symptoms.split(/[\s،,]+/).filter(w => w.length > 1);
            
            if (symptomWords.length === 0) {
                showError('الرجاء إدخال أعراض صحيحة');
                return;
            }

            // 2. البحث في القاعدة المحلية أولاً
            const localResults = searchLocalDB(symptomWords);
            
            if (localResults && localResults.length > 0) {
                displayLocalResults(localResults);
                showMessage(`✅ تم العثور على ${localResults.length} نتائج في قاعدة الأمراض المحلية`);
            } else {
                // 3. إذا لم نجد، نترجم ونبحث في FDA
                showMessage('🔄 جاري البحث في قاعدة FDA...');
                const englishWords = await translateWords(symptomWords);
                const fdaResults = await searchFDA(englishWords);
                
                if (fdaResults && fdaResults.length > 0) {
                    displayFDAResults(fdaResults);
                    showMessage(`✅ تم العثور على ${fdaResults.length} نتائج في FDA`);
                } else {
                    showError('❌ لم يتم العثور على نتائج. استشر طبيبك.');
                }
            }
        } catch (error) {
            console.error('خطأ:', error);
            showError('حدث خطأ. حاول مرة أخرى.');
        } finally {
            toggleLoading(false);
        }
    }

    // ===== البحث في القاعدة المحلية =====
    function searchLocalDB(symptomWords) {
        const results = [];
        
        LOCAL_DISEASES.forEach(disease => {
            let matchCount = 0;
            
            // حساب عدد الكلمات المتطابقة
            symptomWords.forEach(symptom => {
                if (disease.keywords.some(keyword => keyword.includes(symptom) || symptom.includes(keyword))) {
                    matchCount++;
                }
            });
            
            // إذا تطابقت كلمة واحدة على الأقل
            if (matchCount > 0) {
                const probability = Math.min(60 + (matchCount * 10), 95);
                
                results.push({
                    name: disease.name,
                    probability: probability,
                    description: disease.description,
                    symptoms: disease.symptoms,
                    treatment: disease.treatment,
                    medications: disease.medications,
                    advice: disease.advice,
                    matchCount: matchCount
                });
            }
        });
        
        // ترتيب حسب الأكثر تطابقاً
        return results.sort((a, b) => b.matchCount - a.matchCount).slice(0, 3);
    }

    // ===== ترجمة الكلمات =====
    async function translateWords(words) {
        try {
            const translated = [];
            
            for (const word of words) {
                const response = await axios.get(APIS.translate, {
                    params: { client: 'gtx', sl: 'ar', tl: 'en', dt: 't', q: word },
                    timeout: 3000
                });
                
                if (response.data && response.data[0]) {
                    translated.push(response.data[0][0][0]);
                } else {
                    translated.push(word);
                }
            }
            
            return translated.filter(w => w.length > 2);
        } catch {
            return words;
        }
    }

    // ===== البحث في FDA =====
    async function searchFDA(keywords) {
        try {
            if (keywords.length === 0) return null;
            
            const searchTerm = keywords.slice(0, 3).join('+');
            
            const response = await axios.get(APIS.openFDA.url, {
                params: {
                    search: `patient.reaction.reactionmeddrapt:${searchTerm}`,
                    limit: 10,
                    api_key: APIS.openFDA.key
                },
                timeout: 10000
            });

            if (!response.data?.results?.length) return null;

            const drugMap = new Map();
            
            response.data.results.forEach(item => {
                const drug = item.patient?.drug?.[0]?.medicinalproduct;
                if (!drug) return;
                
                const reactions = item.patient?.reaction?.map(r => r.reactionmeddrapt).filter(Boolean) || [];
                
                if (!drugMap.has(drug)) {
                    drugMap.set(drug, {
                        reactions: new Set(),
                        count: 0
                    });
                }
                
                const entry = drugMap.get(drug);
                reactions.forEach(r => entry.reactions.add(r));
                entry.count++;
            });

            return Array.from(drugMap.entries())
                .sort((a, b) => b[1].count - a[1].count)
                .slice(0, 4)
                .map(([drug, data]) => ({
                    name: drug,
                    probability: Math.min(60 + (data.count * 3), 85),
                    description: `دواء ${drug} قد يسبب الأعراض المدخلة (${data.count} تقرير)`,
                    symptoms: Array.from(data.reactions).slice(0, 5).join('، '),
                    treatment: 'يعتمد على شدة الأعراض وتقييم الطبيب',
                    medications: drug,
                    advice: `⚠️ استشر طبيبك قبل إيقاف ${drug}`,
                    source: 'FDA'
                }));

        } catch (error) {
            console.log('FDA Error:', error.message);
            return null;
        }
    }

    // ===== عرض النتائج المحلية =====
    function displayLocalResults(results) {
        const html = results.map((r, i) => `
            <div class="card mb-3" style="border-right: 5px solid #28a745; animation: slideUp 0.3s ${i * 0.1}s">
                <div class="card-header bg-success text-white">
                    <h5 class="mb-0">🏥 ${r.name} (${r.probability}%)</h5>
                </div>
                <div class="card-body">
                    <p><strong>الوصف:</strong> ${r.description}</p>
                    <p><strong>الأعراض:</strong> ${r.symptoms}</p>
                    <p><strong>العلاج:</strong> ${r.treatment}</p>
                    <p><strong>الأدوية:</strong> ${r.medications}</p>
                    <p><strong>نصيحة:</strong> ${r.advice}</p>
                    <small class="text-muted">✅ قاعدة أمراض محلية</small>
                </div>
            </div>
        `).join('');

        $('#resultsContainer').html(`
            <h4 class="mb-3">📋 نتائج من القاعدة المحلية</h4>
            ${html}
        `);
    }

    // ===== عرض نتائج FDA =====
    function displayFDAResults(results) {
        const html = results.map((r, i) => `
            <div class="card mb-3" style="border-right: 5px solid #4260a0; animation: slideUp 0.3s ${i * 0.1}s">
                <div class="card-header" style="background: #4260a0; color: white;">
                    <h5 class="mb-0">💊 ${r.name} (${r.probability}%)</h5>
                </div>
                <div class="card-body">
                    <p><strong>الوصف:</strong> ${r.description}</p>
                    <p><strong>الأعراض:</strong> ${r.symptoms}</p>
                    <p><strong>العلاج:</strong> ${r.treatment}</p>
                    <p><strong>الدواء:</strong> ${r.medications}</p>
                    <p><strong>نصيحة:</strong> ${r.advice}</p>
                    <small class="text-muted">🔬 FDA (إدارة الغذاء والدواء)</small>
                </div>
            </div>
        `).join('');

        $('#resultsContainer').html(`
            <h4 class="mb-3">🔬 نتائج من FDA</h4>
            ${html}
        `);
    }

    function toggleLoading(loading) {
        isAnalyzing = loading;
        $('#analyzeBtn').prop('disabled', loading);
        $('.btn-text').toggle(!loading);
        $('#loadingSpinner').toggleClass('d-none', !loading);
    }

    function showMessage(msg) {
        $('#errorMessage').removeClass('d-none alert-danger').addClass('alert-info')
            .html(`<i class="icofont-info-circle"></i> ${msg}`);
        setTimeout(() => $('#errorMessage').addClass('d-none'), 3000);
    }

    function showError(msg) {
        $('#errorMessage').removeClass('d-none alert-info').addClass('alert-danger')
            .html(`<i class="icofont-exclamation-circle"></i> ${msg}`);
        $('#errorMessage').removeClass('d-none');
        setTimeout(() => $('#errorMessage').addClass('d-none'), 4000);
    }
});