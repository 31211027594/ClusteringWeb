function showForm(type) {
    const manualForm = document.getElementById('manualForm');
    const csvForm = document.getElementById('csvForm');
    const manualBtn = document.getElementById('manualInputBtn');
    const fileBtn = document.getElementById('fileInputBtn');
    const result = document.getElementById('result');
    const csvResult = document.getElementById('csvResult');
    
    // Reset kết quả
    result.innerHTML = "Result: ";
    csvResult.innerHTML = "";

    // Reset forms
    resetForm(manualForm);
    resetForm(csvForm);
    
    if (type === 'manual') {
        manualForm.style.display = 'block';
        csvForm.style.display = 'none';
        manualBtn.classList.add('hover');
        fileBtn.classList.remove('hover');
    } else if (type === 'file') {
        manualForm.style.display = 'none';
        csvForm.style.display = 'block';
        manualBtn.classList.remove('hover');
        fileBtn.classList.add('hover');
    }
}

function resetForm(form) {
    const inputs = form.getElementsByTagName('input');
    for (let input of inputs) {
        input.value = '';
    }
}

async function predict() {
    const features = [
        'feature1', 'feature2', 'feature3', 'feature4', 
        'feature5', 'feature6', 'feature7', 'feature8', 'feature9'
    ];

    let allFilled = true;
    let anyFilled = false;
    const input = features.map(id => {
        const element = document.getElementById(id);
        const value = element.value;
        if (!value) {
            allFilled = false;
            element.style.borderColor = 'red';
        } else {
            anyFilled = true;
            element.style.borderColor = '';
        }
        return parseFloat(value);
    });

    if (!anyFilled) {
        document.getElementById('result').innerText = 'Please enter the values into the form!';
        return;
    }

    if (!allFilled) {
        document.getElementById('result').innerText = 'Please fill in all required fields!';
        return;
    }

    // Tải mô hình từ máy chủ
    const response = await fetch('best_cluster_model.json');
    const model = await response.json();

    // Chuẩn hóa dữ liệu đầu vào
    const mean = model.mean;
    const std = model.std;
    const normalizedInput = input.map((value, index) => (value - mean[index]) / std[index]);
    console.log("Normalized input data:", normalizedInput);

    // Tính toán khoảng cách Euclidean từ điểm dữ liệu đến từng centroid
    const clusters = model.centroids.map(centroid => {
        return euclideanDistance(normalizedInput, centroid);
    });
    console.log("Distances to centroids:", clusters);

    // Tìm cụm gần nhất
    const cluster = clusters.indexOf(Math.min(...clusters));

    // Gán nhãn kết quả
    let resultText;
    switch(cluster) {
        case 0:
            resultText = 'Quốc gia đang phát triển !';
            break;
        case 1:
            resultText = 'Quốc gia chậm phát triển !';
            break;
        case 2:
            resultText = 'Quốc gia phát triển !';
            break;
        default:
            resultText = 'Unknown';
    }

    document.getElementById('result').innerText = `Result: Cụm ${cluster} - ${resultText}`;
}

function euclideanDistance(a, b) {
    return Math.sqrt(a.reduce((sum, value, index) => sum + Math.pow(value - b[index], 2), 0));
}

async function predictCSV() {
    const fileInput = document.getElementById('csvFileInput');
    if (!fileInput.files.length) {
        document.getElementById('csvResult').innerText = 'Please upload a CSV file!';
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = async function(event) {
        const csvData = event.target.result;
        const parsedData = parseCSV(csvData);
        
        if (!parsedData.length) {
            document.getElementById('csvResult').innerText = 'The CSV file is empty or formatted incorrectly!';
            return;
        }

        const response = await fetch('best_cluster_model.json');
        const model = await response.json();

        const mean = model.mean;
        const std = model.std;

        const results = parsedData.map(row => {
            const normalizedInput = row.features.map((value, index) => (value - mean[index]) / std[index]);
            const clusters = model.centroids.map(centroid => euclideanDistance(normalizedInput, centroid));
            const cluster = clusters.indexOf(Math.min(...clusters));
            return { country: row.country, cluster };
        });

        displayCSVResults(results);
    };
    reader.readAsText(file);
}

function parseCSV(data) {
    const rows = data.split('\n').map(row => row.trim()).filter(row => row.length);
    const header = rows.shift(); // Bỏ dòng tiêu đề
    return rows.map(row => {
        const cols = row.split(',').map(item => item.trim());
        const country = cols.shift(); // Bỏ cột country
        const features = cols.map(Number); // Chuyển các cột còn lại thành số
        return { country, features };
    }).filter(row => row.features.length === 9);
}

function displayCSVResults(results) {
    let output = '<table border="1"><tr><th>Country</th><th>Cluster</th><th>Result</th></tr>';
    results.forEach(result => {
        let resultText;
        switch(result.cluster) {
            case 0:
                resultText = 'Quốc gia đang phát triển !';
                break;
            case 1:
                resultText = 'Quốc gia chậm phát triển !';
                break;
            case 2:
                resultText = 'Quốc gia phát triển !';
                break;
            default:
                resultText = 'Unknown';
        }
        output += `<tr><td>${result.country}</td><td>${result.cluster}</td><td>${resultText}</td></tr>`;
    });
    output += '</table>';
    document.getElementById('csvResult').innerHTML = output;
}

function euclideanDistance(a, b) {
    return Math.sqrt(a.reduce((sum, value, index) => sum + Math.pow(value - b[index], 2), 0));
}


