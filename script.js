const video = document.getElementById('video');
const expressionDiv = document.getElementById('expression');
const colorBox = document.getElementById('colorBox'); // 사각형 요소

// 모델 파일 로드
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
    faceapi.nets.faceExpressionNet.loadFromUri('./models')
]).then(startVideo);

function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => video.srcObject = stream)
        .catch(err => console.error(err));
}

video.addEventListener('play', () => {
    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions();

        if (detections.length > 0) {
            const expressions = detections[0].expressions;

            const anger = expressions.anger || 0;
            const happy = expressions.happy || 0;
            const sad = expressions.sad || 0;
            const neutral = expressions.neutral || 0;
            const surprised = expressions.surprised || 0;
            const fear = expressions.fear || 0;

            const red = Math.round(
                anger * 255 +
                happy * 255 +
                surprised * 255 +
                fear * 128
            );
            const green = Math.round(
                happy * 255 +
                neutral * 255 +
                surprised * 165
            );
            const blue = Math.round(
                sad * 255 +
                neutral * 255 +
                fear * 255
            );

            const textColor = `rgb(${red}, ${green}, ${blue})`;

            // 가장 비율이 높은 감정 찾기
            const highestExpression = Object.keys(expressions).reduce((a, b) =>
                expressions[a] > expressions[b] ? a : b
            );

            // 감정별 기본 색상 정의
            const emotionColors = {
                anger: 'rgb(255, 0, 0)',
                happy: 'rgb(255, 255, 0)',
                sad: 'rgb(0, 0, 255)',
                neutral: 'rgb(128, 128, 128)',
                surprised: 'rgb(255, 165, 0)',
                fear: 'rgb(128, 0, 128)',
            };

            const dominantColor = emotionColors[highestExpression] || 'white';

            // 사각형 그라데이션 설정
            colorBox.style.background = `linear-gradient(to bottom, ${textColor}, ${dominantColor})`;

            // 텍스트 업데이트 (페이드 효과)
            if (expressionDiv.textContent !== `Detected Expression: ${highestExpression}`) {
                expressionDiv.style.opacity = 0; // 페이드아웃
                setTimeout(() => {
                    expressionDiv.textContent = `Detected Expression: ${highestExpression}`;
                    expressionDiv.style.opacity = 1; // 페이드인
                }, 500); // 페이드 효과 타이밍과 일치
            }
        } else {
            // 얼굴이 감지되지 않았을 경우
            if (expressionDiv.textContent !== 'No face detected') {
                expressionDiv.style.opacity = 0; // 페이드아웃
                setTimeout(() => {
                    expressionDiv.textContent = 'No face detected';
                    expressionDiv.style.opacity = 1; // 페이드인
                }, 500);
            }
            colorBox.style.background = 'white'; // 기본값
        }
    }, 100);
});
