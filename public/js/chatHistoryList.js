document.addEventListener('DOMContentLoaded', function() {
    const uuidElements = document.querySelectorAll('.uuid-copy');
    const deleteButtons = document.querySelectorAll('.delete-btn');

    // UUID コピー機能
    uuidElements.forEach(element => {
        element.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();

            const uuid = this.getAttribute('data-uuid');
            const command = `/revert uuid:${uuid}`;

            navigator.clipboard.writeText(command).then(() => {
                showCopyFeedback(this);
            }).catch(err => {
                console.error('クリップボードへのコピーに失敗しました:', err);
            });
        });
    });

    // 削除ボタン機能
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();

            const uuid = this.getAttribute('data-uuid');
            const name = this.getAttribute('data-name');

            if (confirm(`本当に「${name}」を削除しますか？\n\nこの操作は取り消すことができません。`)) {
                deleteChatHistory(uuid, this);
            }
        });
    });
});

function showCopyFeedback(element) {
    const originalText = element.textContent;
    element.textContent = 'コピー済み！';
    element.style.color = '#28a745';

    setTimeout(() => {
        element.textContent = originalText;
        element.style.color = '';
    }, 1500);
}

function deleteChatHistory(uuid, buttonElement) {
    // ボタンを無効化して削除中表示
    buttonElement.disabled = true;
    buttonElement.innerHTML = '<i class="bi bi-hourglass"></i> 削除中...';

    fetch(`/chat/history/${uuid}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.result) {
            // 成功時はカード全体をフェードアウトして削除
            const card = buttonElement.closest('.col-md-6');
            card.style.transition = 'opacity 0.3s ease';
            card.style.opacity = '0';

            setTimeout(() => {
                card.remove();
                // ページに履歴が残っていない場合はリロード
                const remainingCards = document.querySelectorAll('.col-md-6');
                if (remainingCards.length === 0) {
                    location.reload();
                }
            }, 300);
        } else {
            alert('削除に失敗しました: ' + data.message);
            // ボタンを元に戻す
            buttonElement.disabled = false;
            buttonElement.innerHTML = '<i class="bi bi-trash"></i> 削除';
        }
    })
    .catch(err => {
        console.error('削除リクエストに失敗しました:', err);
        alert('削除に失敗しました。ネットワークエラーです。');
        // ボタンを元に戻す
        buttonElement.disabled = false;
        buttonElement.innerHTML = '<i class="bi bi-trash"></i> 削除';
    });
}