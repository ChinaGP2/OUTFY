const SUPABASE_URL = 'https://xrhatawtpnopxkmmpsyb.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyaGF0YXd0cG5vcHhrbW1wc3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjI4OTEsImV4cCI6MjA3NjQ5ODg5MX0.ox-Wj5c7efrssSzbcmxiTypAtzXo2pUWVERk1ErSTVo';

// Importa a biblioteca de I.A. diretamente. Isso garante que ela estará carregada antes de ser usada.
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';

// Configuração da I.A.: Desabilita o carregamento de modelos locais e força o uso do CDN da Hugging Face.
env.allowLocalModels = false;

document.addEventListener('DOMContentLoaded', () => {
    const { createClient } = supabase;
    let supabaseClient;
    let currentUser = null;

    const authScreen = document.getElementById('auth-screen');
    const appContent = document.getElementById('app-content');
    const authContainer = document.getElementById('auth-container');
    const pages = document.querySelectorAll('.page');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const postButton = document.getElementById('post-btn');
    const modalContainer = document.getElementById('modal-container');
    const modalContent = document.getElementById('modal-content');
    const postDetailModal = document.getElementById('post-detail-modal');
    const overlayModal = document.getElementById('overlay-modal');
    const notificationButton = document.getElementById('notification-button'); // This is the bell icon
    const mainHeader = document.getElementById('main-header');
    const pageHeader = document.getElementById('page-header');
    const headerTitle = document.getElementById('header-title');
    const pageHeaderTitle = document.getElementById('page-header-title');
    const backButton = document.getElementById('back-button');
    // --- FUNÇÕES DE UI ---
    const showMessage = (message, type = 'info') => {
        const colors = { info: 'blue', success: 'green', error: 'red' };
        const color = colors[type];
        return `<div class="bg-${color}-100 border-l-4 border-${color}-500 text-${color}-700 p-4 rounded-lg" role="alert">${message}</div>`;
    };
    const showSpinner = (container) => { container.innerHTML = '<div class="spinner mx-auto mt-8"></div>'; };
    const openModal = (html) => {
        modalContent.innerHTML = html;
        mainHeader.classList.add('hidden'); // Esconde o cabeçalho principal
        modalContainer.classList.remove('opacity-0', 'pointer-events-none');
        modalContent.classList.remove('scale-95');
        lucide.createIcons();
    };
    const closeModal = () => {
        mainHeader.classList.remove('hidden'); // Mostra o cabeçalho principal novamente
        modalContainer.classList.add('opacity-0', 'pointer-events-none');
        modalContent.classList.add('scale-95');
        modalContent.innerHTML = ''; // Limpa o conteúdo ao fechar
    };
    const closePostDetailModal = () => {
        mainHeader.classList.remove('hidden'); // Mostra o cabeçalho principal novamente
        postDetailModal.classList.add('opacity-0', 'pointer-events-none');
        // Limpa o conteúdo para evitar que apareça rapidamente na próxima abertura
        postDetailModal.innerHTML = '';
    };
    const closeOverlayModal = () => {
        overlayModal.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => {
            overlayModal.innerHTML = '';
        }, 300); // Aguarda a transição para limpar
    };

    // --- LÓGICA DE AUTENTICAÇÃO ---
    const handleLogin = async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const loginBtn = document.getElementById('login-btn');
        const messageDiv = document.getElementById('auth-message');
        loginBtn.disabled = true;
        loginBtn.innerText = 'Entrando...';
        messageDiv.innerHTML = '';
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
            messageDiv.innerHTML = showMessage(`<p>${error.message}</p>`, 'error');
            loginBtn.disabled = false;
            loginBtn.innerText = 'Entrar';
        }
    };
    const handleSignup = async () => {
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const gender = document.getElementById('gender').value;
        const signupBtn = document.getElementById('signup-btn');
        const messageDiv = document.getElementById('auth-message');
        messageDiv.innerHTML = '';
        if (!username || !email || !password || !gender) { messageDiv.innerHTML = showMessage('<p>Todos os campos são obrigatórios.</p>', 'error'); return; }
        if (password.length < 6) { messageDiv.innerHTML = showMessage('<p>A senha deve ter no mínimo 6 caracteres.</p>', 'error'); return; }
        signupBtn.disabled = true;
        signupBtn.innerText = 'Criando...';
        const { error } = await supabaseClient.auth.signUp({ email, password, options: { data: { username: username, gender: gender } } });
        if (error) {
            messageDiv.innerHTML = showMessage(`<p>${error.message}</p>`, 'error');
            signupBtn.disabled = false;
            signupBtn.innerText = 'Criar Conta';
        } else {
             authContainer.innerHTML = showMessage(`<p class="font-bold">Cadastro realizado!</p><p>Enviamos um link de confirmação para o seu e-mail para ativar sua conta.</p><button id="back-to-login" class="mt-4 text-pink-500 font-semibold">Voltar para Login</button>`, 'success');
             document.getElementById('back-to-login').addEventListener('click', showLoginForm);
        }
    };
    const showLoginForm = () => {
        authContainer.innerHTML = `
            <div id="auth-message"></div>
            <input id="email" type="email" placeholder="E-mail" class="w-full p-3 border rounded-lg mb-3">
            <input id="password" type="password" placeholder="Senha" class="w-full p-3 border rounded-lg mb-4">
            <button id="login-btn" class="w-full bg-pink-500 text-white font-semibold py-3 rounded-lg shadow-md mb-4">Entrar</button>
            <p class="text-center text-sm">Não tem uma conta? <a href="#" id="show-signup" class="text-pink-500 font-semibold">Cadastre-se</a></p>
        `;
        document.getElementById('show-signup').addEventListener('click', showSignupForm);
        document.getElementById('login-btn').addEventListener('click', handleLogin);
    };
    const showSignupForm = () => {
         authContainer.innerHTML = `
            <div id="auth-message"></div>
            <input id="username" type="text" placeholder="Nome de usuário" class="w-full p-3 border rounded-lg mb-3">
            <input id="email" type="email" placeholder="E-mail" class="w-full p-3 border rounded-lg mb-3">
            <input id="password" type="password" placeholder="Senha (mín. 6 caracteres)" class="w-full p-3 border rounded-lg mb-3">
            <select id="gender" class="w-full p-3 border rounded-lg mb-4 bg-white text-gray-500">
                <option value="" disabled selected>Gênero</option>
                <option value="Feminino">Feminino</option>
                <option value="Masculino">Masculino</option>
                <option value="Nao-binario">Não-binário</option>
                <option value="Prefiro não informar">Prefiro não informar</option>
            </select>
            <button id="signup-btn" class="w-full bg-pink-500 text-white font-semibold py-3 rounded-lg shadow-md mb-4">Criar Conta</button>
            <p class="text-center text-sm">Já tem uma conta? <a href="#" id="show-login" class="text-pink-500 font-semibold">Entrar</a></p>
        `;
        document.getElementById('show-login').addEventListener('click', showLoginForm);
        document.getElementById('signup-btn').addEventListener('click', handleSignup);
    };
    const handleLogout = async () => { if (supabaseClient) await supabaseClient.auth.signOut(); };

    // --- RENDERIZAÇÃO ---
    const renderFeed = async () => {
        const feedPage = document.getElementById('page-feed');
        showSpinner(feedPage);
        const { data: posts, error } = await supabaseClient.from('posts').select(`*, profiles:user_id(username, avatar_url)`).order('created_at', { ascending: false });
        if (error) { feedPage.innerHTML = showMessage(`<p>${error.message}</p>`, 'error'); return; }
        if (!posts || posts.length === 0) { feedPage.innerHTML = `<p class="text-center text-gray-500 p-8">Nenhum post ainda. Seja o primeiro a postar!</p>`; return; }
        
        const [savedPostsRes, likedPostsRes] = await Promise.all([
            supabaseClient.from('saved_posts').select('post_id').eq('user_id', currentUser.id),
            supabaseClient.from('like').select('post_id').eq('user_id', currentUser.id)
        ]);

        const savedPostIds = new Set(savedPostsRes.data.map(p => p.post_id));
        const likedPostIds = new Set(likedPostsRes.data.map(p => p.post_id));

        feedPage.innerHTML = posts.map(post => {
            const profile = post.profiles || { username: 'Usuário', avatar_url: null };
            const username = profile.username || 'Usuário';
            const isSaved = savedPostIds.has(post.id);
            const isLiked = likedPostIds.has(post.id);
            const isOwner = post.user_id === currentUser.id;

            return `
            <div class="border-b border-gray-100" data-post-container-id="${post.id}">
                <div class="p-4 flex items-center justify-between">
                    <div class="flex items-center">
                        <img src="${profile.avatar_url || 'https://placehold.co/40x40/ccc/fff?text=' + username.charAt(0)}" class="w-10 h-10 rounded-full mr-3">
                        <span class="font-semibold">${username}</span>
                    </div>
                    ${isOwner ? `<button data-action="open-post-options" data-post-id="${post.id}" data-caption="${post.caption}" class="text-gray-500"><i data-lucide="more-horizontal"></i></button>` : ''}
                </div>
                <div data-action="open-post-detail" data-post-id="${post.id}" class="cursor-pointer bg-black">
                    <img src="${SUPABASE_URL}/storage/v1/object/public/posts-images/${post.image_url}" class="w-full h-auto max-h-[70vh] object-contain">
                </div>
                <div class="p-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                            <button data-action="like-post" data-post-id="${post.id}">
                                <i data-lucide="heart" class="${isLiked ? 'filled-blue' : ''}"></i>
                            </button>
                            <button data-action="open-comments" data-post-id="${post.id}">
                                <i data-lucide="message-circle"></i>
                            </button>
                            <button data-action="show-coming-soon"><i data-lucide="send"></i></button>
                        </div>
                        <button data-action="save-post" data-post-id="${post.id}">
                            <i data-lucide="bookmark" class="${isSaved ? 'filled' : ''}"></i>
                        </button>
                    </div>
                    <p class="mt-2 text-sm"><strong data-likes-count="${post.id}">${post.likes_count || 0}</strong> curtidas</p>
                    <p class="mt-1"><strong>${username}</strong> ${post.caption}</p>
                    ${post.comments_count > 0 ? `<p class="text-sm text-gray-500 mt-1 cursor-pointer" data-action="open-comments" data-post-id="${post.id}">Ver todos os ${post.comments_count} comentários</p>` : ''}
                </div>
            </div>`;
        }).join('');
        lucide.createIcons();
    };

    const renderUserProfile = async (user) => {
        const profilePage = document.getElementById('page-perfil');
        showSpinner(profilePage);
        let profile = null;
        let attempts = 0;
        while (profile === null && attempts < 5) {
            const { data } = await supabaseClient.from('profiles').select('*').eq('id', user.id).single();
            profile = data;
            if (profile === null) {
                attempts++;
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        if (!profile) { profilePage.innerHTML = showMessage(`<p class="font-bold">Erro ao carregar o perfil.</p><p class="text-sm mt-1">Tente sair e entrar novamente.</p>`, 'error'); return; }
        
        const { count: postCount } = await supabaseClient.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

        // Busca contagem de seguidores e seguindo
        const { count: followersCount } = await supabaseClient.from('followers').select('*', { count: 'exact', head: true }).eq('following_id', user.id);
        const { count: followingCount } = await supabaseClient.from('followers').select('*', { count: 'exact', head: true }).eq('follower_id', user.id);

        profilePage.innerHTML = `
            <div class="p-4 border-b border-gray-100">
                <div class="flex items-center mb-4">
                    <img src="${profile.avatar_url || 'https://placehold.co/80x80/ccc/fff?text=' + (profile.username ? profile.username.charAt(0) : '?')}" class="w-20 h-20 rounded-full mr-4">
                    <div class="flex-grow flex justify-around text-center">
                        <div><p class="font-bold text-lg">${postCount || 0}</p><p class="text-sm text-gray-500">Posts</p></div>
                        <div><p class="font-bold text-lg">${followersCount || 0}</p><p class="text-sm text-gray-500">Seguidores</p></div>
                        <div><p class="font-bold text-lg">${followingCount || 0}</p><p class="text-sm text-gray-500">Seguindo</p></div>
                    </div>
                </div>
                <div>
                    <h2 class="font-bold">${profile.username}</h2>
                    <p class="text-gray-600 text-sm">${profile.bio || ''}</p>
                    ${profile.website_url ? `<a href="${profile.website_url}" target="_blank" class="text-blue-500 text-sm">${profile.website_url}</a>` : ''}
                </div>
                <div class="flex items-center space-x-2 mt-4">
                    <button data-action="open-edit-profile" class="w-full bg-gray-200 text-gray-800 font-semibold py-2 rounded-lg text-sm">Editar Perfil</button>
                    <button id="logout-button" class="p-2 bg-gray-200 text-gray-800 rounded-lg"><i data-lucide="log-out" class="w-5 h-5"></i></button>
                </div>
            </div>
            <div class="flex border-b border-gray-200">
                <button class="profile-tab active w-1/2 p-3 text-center" data-tab="posts"><i data-lucide="grid"></i></button>
                <button class="profile-tab w-1/2 p-3 text-center text-gray-500" data-tab="saved"><i data-lucide="bookmark"></i></button>
            </div>
            <div id="profile-content"></div>
        `;
        lucide.createIcons();
        document.getElementById('logout-button').addEventListener('click', handleLogout);
        document.querySelectorAll('.profile-tab').forEach(tab => tab.addEventListener('click', () => switchProfileTab(tab, user)));
        renderUserPosts(user);
    };
    
    const switchProfileTab = (clickedTab, user) => {
        document.querySelectorAll('.profile-tab').forEach(tab => tab.classList.remove('active'));
        clickedTab.classList.add('active');
        if (clickedTab.dataset.tab === 'posts') {
            renderUserPosts(user);
        } else {
            renderSavedPosts(user);
        }
    };

    const renderUserPosts = async (user) => {
        const contentDiv = document.getElementById('profile-content');
        showSpinner(contentDiv);
        const { data: posts } = await supabaseClient.from('posts').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (!posts || posts.length === 0) { 
            contentDiv.innerHTML = `<p class="text-center text-gray-500 p-8">Nenhum post publicado.</p>`; 
            return; 
        }
        contentDiv.innerHTML = `<div class="grid grid-cols-3 gap-0.5">${(posts).map(p => `
                <div data-action="open-post-detail" data-post-id="${p.id}" class="cursor-pointer aspect-square">
                    <img src="${SUPABASE_URL}/storage/v1/object/public/posts-images/${p.image_url}" class="w-full h-full object-cover">
                </div>
            `).join('')}</div>`;
    };

    const renderSavedPosts = async (user) => {
        const contentDiv = document.getElementById('profile-content');
        showSpinner(contentDiv);
        const { data: saved, error } = await supabaseClient.from('saved_posts').select(`posts(*, profiles:user_id(username, avatar_url))`).eq('user_id', user.id).order('created_at', { ascending: false });
        if (error || !saved || saved.length === 0) { 
            contentDiv.innerHTML = `<p class="text-center text-gray-500 p-8">Nenhum post salvo.</p>`; 
            return; 
        }
        contentDiv.innerHTML = `<div class="grid grid-cols-3 gap-0.5">${saved.map(item => `
                <div data-action="open-post-detail" data-post-id="${item.posts.id}" class="cursor-pointer aspect-square">
                    <img src="${SUPABASE_URL}/storage/v1/object/public/posts-images/${item.posts.image_url}" class="w-full h-full object-cover">
                </div>
            `).join('')}</div>`;
    };
    
    const openPostDetailView = async (postId) => {
        const postDetailContainer = document.getElementById('post-detail-modal');
        showSpinner(postDetailContainer);
        mainHeader.classList.add('hidden'); // Esconde o cabeçalho principal
        postDetailModal.classList.remove('opacity-0', 'pointer-events-none');

        const { data: post, error } = await supabaseClient
            .from('posts')
            .select(`*, user_id, profiles:user_id(username, avatar_url)`)
            .eq('id', postId)
            .single();

        if (error || !post) {
            postDetailContainer.innerHTML = showMessage('Post não encontrado.', 'error');
            setTimeout(closePostDetailModal, 2000);
            return;
        }

        // Verifica se o usuário atual curtiu ou salvou este post
        const { data: likeData } = await supabaseClient.from('like').select('post_id').eq('user_id', currentUser.id).eq('post_id', postId);
        const { data: saveData } = await supabaseClient.from('saved_posts').select('post_id').eq('user_id', currentUser.id).eq('post_id', postId);
        
        const isOwner = post.user_id === currentUser.id;
        let isFollowing = false;
        if (!isOwner) {
            const { data: followingData } = await supabaseClient.from('followers').select('*').eq('follower_id', currentUser.id).eq('following_id', post.user_id);
            isFollowing = followingData && followingData.length > 0;
        }

        const isLiked = likeData && likeData.length > 0; // Mais eficiente
        const isSaved = saveData && saveData.length > 0;

        // Renderiza a estrutura inicial do post
        postDetailContainer.innerHTML = `
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col transform transition-transform duration-300 scale-100">
                <div class="p-4 bg-white flex items-center justify-between shrink-0 border-b border-gray-200 rounded-t-2xl">
                    <div class="flex items-center flex-grow">
                        <img src="${post.profiles.avatar_url || 'https://placehold.co/32x32/ccc/fff?text=' + post.profiles.username.charAt(0)}" class="w-8 h-8 rounded-full mr-2">
                        <span class="font-bold">${post.profiles.username}</span>
                        ${!isOwner ? `
                            <span class="mx-2 text-gray-400">&bull;</span>
                            <button data-action="toggle-follow" data-user-id="${post.user_id}" class="text-pink-500 font-semibold text-sm">${isFollowing ? 'Seguindo' : 'Seguir'}</button>
                        ` : ''}
                    </div>
                    ${isOwner ? `<button data-action="open-post-options" data-post-id="${post.id}" data-caption="${post.caption}"><i data-lucide="more-horizontal"></i></button>` : '<div class="w-8"></div>'}
                </div>
                <div class="overflow-y-auto">
                    <img src="${SUPABASE_URL}/storage/v1/object/public/posts-images/${post.image_url}" class="w-full h-auto object-contain bg-gray-50">
                    <div class="p-4">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-4">
                                <button data-action="like-post" data-post-id="${post.id}">
                                    <i data-lucide="heart" class="${isLiked ? 'filled-blue' : ''}"></i>
                                </button>
                                <button data-action="open-comments" data-post-id="${post.id}"><i data-lucide="message-circle"></i></button>
                                <button data-action="show-coming-soon"><i data-lucide="send"></i></button>
                            </div>
                            <button data-action="save-post" data-post-id="${post.id}">
                                <i data-lucide="bookmark" class="${isSaved ? 'filled' : ''}"></i>
                            </button>
                        </div>
                        <p class="mt-2 text-sm"><strong data-likes-count="${post.id}">${post.likes_count || 0}</strong> curtidas</p>
                        <div id="comments-section" class="mt-2">
                            <p id="detail-caption-${post.id}" class="mt-1"><strong>${post.profiles.username}</strong> ${post.caption}</p>
                            <div id="comments-list" class="mt-2">
                                <div class="spinner-small mx-auto"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Input Fixo no Rodapé -->
                <div class="p-2 border-t bg-white shrink-0 mt-auto">
                    <div class="flex items-center">
                        <input id="comment-input" type="text" placeholder="Adicione um comentário..." class="w-full p-2 border-none rounded-lg focus:ring-0 bg-gray-100">
                        <button id="post-comment-btn" data-post-id="${postId}" class="ml-2 text-pink-500 font-semibold">Publicar</button>
                    </div>
                </div>
            </div>
        `;
        lucide.createIcons();
        document.getElementById('post-comment-btn').addEventListener('click', handlePostComment);

        // Carrega os comentários de forma assíncrona
        await renderComments(postId);
    };

    const renderComments = async (postId) => {
        const commentsListContainer = document.getElementById('comments-list');
        if (!commentsListContainer) return;

        const [commentsRes, likedCommentsRes] = await Promise.all([
            supabaseClient.from('comments').select(`*, profiles:user_id(username, avatar_url)`).eq('post_id', postId).order('created_at', { ascending: true }),
            supabaseClient.from('comment_likes').select('comment_id').eq('user_id', currentUser.id)
        ]);

        const comments = commentsRes.data || [];
        const likedCommentIds = new Set((likedCommentsRes.data || []).map(l => l.comment_id));

        if (comments.length === 0) {
            commentsListContainer.innerHTML = `<p class="text-sm text-gray-500 mt-2">Nenhum comentário ainda.</p>`;
            return;
        }

        commentsListContainer.innerHTML = comments.map(comment => {
            const isLiked = likedCommentIds.has(comment.id);
            return `
            <div class="comment-item flex items-start mt-3 group" data-comment-id="${comment.id}">
                <img src="${comment.profiles.avatar_url || 'https://placehold.co/32x32/ccc/fff?text=' + comment.profiles.username.charAt(0)}" class="w-8 h-8 rounded-full mr-3 shrink-0">
                <div class="text-sm flex-grow">
                    <p><strong>${comment.profiles.username}</strong> ${comment.content}</p>
                    <div class="flex items-center text-xs text-gray-500 mt-1 space-x-2">
                        <span>${comment.likes_count > 0 ? `<span data-comment-likes-count="${comment.id}">${comment.likes_count}</span> curtida(s)` : ''}</span>
                    </div>
                </div>
                <div class="flex items-center ml-2 shrink-0">
                    ${comment.user_id === currentUser.id ? `
                        <button data-action="delete-comment" data-comment-id="${comment.id}" data-post-id="${postId}" class="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    ` : ''}
                    <button data-action="like-comment" data-comment-id="${comment.id}" class="text-gray-400 hover:text-red-500 ml-2">
                        <i data-lucide="heart" class="w-4 h-4 ${isLiked ? 'filled-blue' : ''}"></i>
                    </button>
                </div>
            </div>
        `}).join('');
        lucide.createIcons();
    };

    const openCommentsPage = (postId) => {
        // Esta função agora simplesmente abre o modal de detalhes, que já contém os comentários.
        openPostDetailView(postId);
    };

    const handlePostComment = async (e) => {
        const postId = e.target.dataset.postId;
        const input = document.getElementById('comment-input');
        const content = input.value.trim();
        if (!content) return;
        e.target.disabled = true;

        const { data, error } = await supabaseClient.from('comments').insert({
            post_id: postId,
            user_id: currentUser.id,
            content: content
        }).select(`*, profiles:user_id(username, avatar_url)`).single();

        if (error) {
            alert('Erro ao publicar comentário: ' + error.message);
            e.target.disabled = false;
        } else {
            input.value = ''; // Limpa o input
            e.target.disabled = false;
            // Atualiza a contagem de comentários no post
            await supabaseClient.rpc('update_comments_count', { post_id_to_update: postId, increment_value: 1 });
            // Recarrega a lista de comentários dentro do modal
            await renderComments(postId);
            // Atualiza o contador no feed
            updateCommentCountOnFeed(postId, 1);
        }
    };

    const updateCommentCountOnFeed = (postId, change) => {
        const postContainer = document.querySelector(`[data-post-container-id="${postId}"]`);
        if (!postContainer) return;

        let countElement = postContainer.querySelector(`[data-action="open-comments"] p`);
        const currentCount = parseInt(countElement?.textContent.match(/\d+/)?.[0] || '0', 10);
        const newCount = currentCount + change;

        if (newCount > 0) {
            if (countElement) {
                countElement.textContent = `Ver todos os ${newCount} comentários`;
            } else {
                // Se o elemento não existia (era o primeiro comentário), cria-o.
                const p = document.createElement('p');
                p.className = "text-sm text-gray-500 mt-1 cursor-pointer";
                p.dataset.action = "open-comments";
                p.dataset.postId = postId;
                p.textContent = `Ver todos os 1 comentários`;
                postContainer.querySelector('.p-4').appendChild(p);
            }
        } else if (countElement) {
            // Se a contagem for zero, remove o elemento.
            countElement.remove();
        }
    };

    const handleDeleteComment = async (button) => {
        const commentId = button.dataset.commentId;
        const postId = button.dataset.postId;
        const { error } = await supabaseClient.from('comments').delete().eq('id', commentId);
        if (error) { alert('Erro ao deletar comentário: ' + error.message); return; }
        
        // Remove o comentário da UI
        document.querySelector(`.comment-item[data-comment-id="${commentId}"]`)?.remove();
        
        // Atualiza a contagem
        await supabaseClient.rpc('update_comments_count', { post_id_to_update: postId, increment_value: -1 });
        
        // Recarrega o feed para atualizar o contador
        updateCommentCountOnFeed(postId, -1);
    };

    const handleLikeComment = async (button) => {
        const commentId = button.dataset.commentId;
        // A verificação agora é feita diretamente no SVG
        const svgIcon = button.querySelector('svg.lucide-heart');
        const isLiked = svgIcon.classList.contains('filled-blue');

        if (isLiked) {
            // Descurtir
            const { error } = await supabaseClient.from('comment_likes').delete().match({ user_id: currentUser.id, comment_id: commentId });
            if (!error) {
                // Se sucesso, atualiza a UI
                svgIcon.classList.remove('filled-blue');
                const countElement = document.querySelector(`[data-comment-likes-count="${commentId}"]`);
                if (countElement) {
                    const newCount = Math.max(0, parseInt(countElement.textContent, 10) - 1);
                    countElement.textContent = newCount;
                }
                await supabaseClient.rpc('update_comment_likes_count', { comment_id_to_update: commentId, increment_value: -1 });
            }
        } else {
            // Curtir
            const { error } = await supabaseClient.from('comment_likes').insert({ user_id: currentUser.id, comment_id: commentId }, { onConflict: ['user_id', 'comment_id'] });
            if (!error) {
                // Se sucesso, atualiza a UI
                svgIcon.classList.add('filled-blue');
                const countElement = document.querySelector(`[data-comment-likes-count="${commentId}"]`);
                if (countElement) {
                    countElement.textContent = parseInt(countElement.textContent, 10) + 1;
                } else {
                    const container = button.closest('.comment-item').querySelector('.text-xs');
                    container.innerHTML = `<span><span data-comment-likes-count="${commentId}">1</span> curtida(s)</span>`;
                }
                await supabaseClient.rpc('update_comment_likes_count', { comment_id_to_update: commentId, increment_value: 1 });
            } else { console.error("Erro ao curtir comentário:", error); alert("Erro ao curtir comentário: " + error.message); }
        }
    };
    
    const openPostOptionsModal = (button) => {
        // Esta função agora usa o modal genérico, que vai sobrepor o detalhe do post.
        const postId = button.dataset.postId;
        const caption = button.dataset.caption;
        openModal(`
            <div class="text-center">
                <button data-action="open-edit-caption" data-post-id="${postId}" data-caption="${caption}" class="w-full py-3 font-semibold text-blue-500 border-b">Editar</button>
                <button data-action="open-delete-modal" data-post-id="${postId}" class="w-full py-3 font-semibold text-red-500 border-b">Excluir</button>
                <!-- Este botão fecha o modal de opções, mas mantém o modal de detalhe do post aberto -->
                <button data-action="close-modal" class="w-full py-3 font-semibold">Cancelar</button>
            </div>
        `);
    };

    const openEditCaptionModal = async (button) => {
        const postId = button.dataset.postId;
        const caption = button.dataset.caption;
        // Reutiliza o modal genérico para a edição
        openModal(`
            <div class="p-6">
                <h2 class="text-xl font-bold text-center mb-4">Editar Legenda</h2>
                <textarea id="edit-caption-input" class="w-full p-2 border rounded-lg mb-4" rows="4">${caption}</textarea>
                <div class="flex space-x-2">
                    <button data-action="close-modal" class="w-1/2 bg-gray-200 text-gray-800 font-semibold py-2 rounded-lg">Cancelar</button>
                    <button data-action="save-caption" data-post-id="${postId}" class="w-1/2 bg-pink-500 text-white font-semibold py-2 rounded-lg">Salvar</button>
                </div>
            </div>
        `);
    };

    const handleUpdateCaption = async (button) => {
        const postId = button.dataset.postId;
        const newCaption = document.getElementById('edit-caption-input').value;
        const { error } = await supabaseClient.from('posts').update({ caption: newCaption }).eq('id', postId);
        if (error) {
            alert(`Erro ao atualizar a legenda: ${error.message}`);
        } else {
            // Atualiza a legenda na UI sem recarregar tudo
            const captionElement = document.getElementById(`detail-caption-${postId}`);
            if (captionElement) {
                const username = captionElement.querySelector('strong').outerHTML;
                captionElement.innerHTML = `${username} ${newCaption}`;
            }
            // Fecha o modal de edição e reabre o de detalhes
            closeModal(); 
        }
    };

    const handleSavePost = async (buttonElement) => {
        const postId = buttonElement.dataset.postId;
        // Seleciona todos os SVGs de bookmark para este post (no feed e no modal)
        const svgIcons = document.querySelectorAll(`[data-action="save-post"][data-post-id="${postId}"] svg.lucide-bookmark`);
        if (svgIcons.length === 0) return;
        const isSaved = svgIcons[0].classList.contains('filled');

        if (isSaved) {
            // Desmarcar como salvo
            const { error } = await supabaseClient.from('saved_posts').delete().match({ user_id: currentUser.id, post_id: postId });
            if (!error) {
                svgIcons.forEach(svg => svg.classList.remove('filled'));
            } else {
                console.error("Erro ao desmarcar post como salvo:", error);
                alert("Erro ao desmarcar post como salvo: " + error.message);
            }
        } else {
            // Marcar como salvo
            // Usamos 'upsert' para inserir a curtida. Se a curtida (combinação de user_id e post_id) já existir,
            // ele não fará nada e não retornará um erro.
            const { error } = await supabaseClient.from('saved_posts').upsert({ user_id: currentUser.id, post_id: postId });
            if (!error) {
                svgIcons.forEach(svg => svg.classList.add('filled'));
            } else {
                console.error("Erro ao salvar post:", error);
                alert("Erro ao salvar post: " + error.message);
            }
        }
    };
    
    const handleLikePost = async (buttonElement) => {
        const postId = buttonElement.dataset.postId;
        // Seleciona todos os SVGs de coração para este post (no feed e no modal)
        const svgIcons = document.querySelectorAll(`[data-action="like-post"][data-post-id="${postId}"] svg.lucide-heart`);
        if (svgIcons.length === 0) return;
        const isLiked = svgIcons[0].classList.contains('filled-blue');

        if (isLiked) {
            // Descurtir no DB
            const { error } = await supabaseClient.from('like').delete().match({ user_id: currentUser.id, post_id: postId });
            if (!error) {
                // Se sucesso, atualiza a UI
                svgIcons.forEach(svg => svg.classList.remove('filled-blue'));
                document.querySelectorAll(`strong[data-likes-count="${postId}"]`).forEach(el => {
                    el.textContent = Math.max(0, parseInt(el.textContent, 10) - 1);
                });
                await supabaseClient.rpc('increment_likes_count', { post_id_to_update: postId, increment_value: -1 });
            }
        } else {
            // Curtir no DB
            // Usamos 'upsert' para inserir a curtida. Se a curtida (combinação de user_id e post_id) já existir,
            // ele não fará nada e não retornará um erro, resolvendo o problema de "duplicate key" e o erro de sintaxe com "LIKE".
            const { error } = await supabaseClient.from('like').upsert({ user_id: currentUser.id, post_id: postId });

            if (!error) { // Se não houver erro, prossegue com a atualização da UI e notificação
                // Se sucesso, atualiza a UI
                svgIcons.forEach(svg => svg.classList.add('filled-blue'));
                document.querySelectorAll(`strong[data-likes-count="${postId}"]`).forEach(el => {
                    el.textContent = parseInt(el.textContent, 10) + 1;
                });
                await supabaseClient.rpc('increment_likes_count', { post_id_to_update: postId, increment_value: 1 });

                // Notificação (pode continuar em segundo plano)
                supabaseClient.from('posts').select('user_id').eq('id', postId).single().then(({ data: postOwner }) => {
                    if (postOwner && postOwner.user_id !== currentUser.id) {
                        supabaseClient.from('notifications').insert({
                            user_id: postOwner.user_id,
                            actor_id: currentUser.id,
                            type: 'like',
                            post_id: postId
                        }).then();
                    }
                });
            } else { console.error("Erro ao curtir post:", error); alert("Erro ao curtir post: " + error.message); }
        } // Fecha o bloco 'else' (curtir)
    }; // Fecha a função handleLikePost

    const handleToggleFollow = async (button) => {
        const userIdToFollow = button.dataset.userId;
        const isFollowing = button.textContent === 'Seguindo';

        if (isFollowing) {
            // Deixar de seguir
            const { error } = await supabaseClient.from('followers').delete().match({ follower_id: currentUser.id, following_id: userIdToFollow });
            if (!error) {
                button.textContent = 'Seguir';
            }
        } else {
            // Seguir
            const { error } = await supabaseClient.from('followers').insert({ follower_id: currentUser.id, following_id: userIdToFollow });
            if (!error) {
                button.textContent = 'Seguindo';
            }
        }
        // Atualiza os contadores no perfil do usuário logado
        renderUserProfile(currentUser);
    };

    const renderExplorePage = async () => {
        const explorePage = document.getElementById('page-explorar');
        explorePage.innerHTML = `
            <div class="p-4 border-b border-gray-100">
                <div class="relative">
                    <input type="text" id="search-users-input" placeholder="Buscar usuários..." class="w-full p-2 pl-10 border rounded-lg bg-gray-100 focus:ring-pink-500 focus:border-pink-500">
                    <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5"></i>
                </div>
            </div>
            <div id="search-results-container"></div>
            <div id="explore-posts-grid"></div>
        `;
        lucide.createIcons();
        document.getElementById('search-users-input').addEventListener('keyup', handleSearchUsers);

        // Renderiza a grade de posts inicial
        const postsGrid = document.getElementById('explore-posts-grid');
        showSpinner(postsGrid);
        const { data: posts, error } = await supabaseClient.from('posts').select('*').order('created_at', { ascending: false }).limit(21);
        if (error) { postsGrid.innerHTML = showMessage('Erro ao carregar posts.', 'error'); return; }
        if (!posts || posts.length === 0) { postsGrid.innerHTML = `<p class="text-center text-gray-500 p-8">Nenhum post para explorar ainda.</p>`; return; }

        postsGrid.innerHTML = `<div class="grid grid-cols-3 gap-0.5">${posts.map(p => `
                <div data-action="open-post-detail" data-post-id="${p.id}" class="cursor-pointer aspect-square">
                    <img src="${SUPABASE_URL}/storage/v1/object/public/posts-images/${p.image_url}" class="w-full h-full object-cover">
                </div>
            `).join('')}</div>`;
    };

    const handleSearchUsers = async (e) => {
        const query = e.target.value.trim();
        const resultsContainer = document.getElementById('search-results-container');
        const postsGrid = document.getElementById('explore-posts-grid');

        if (query.length < 2) {
            resultsContainer.innerHTML = '';
            postsGrid.style.display = 'block'; // Mostra a grade de posts se a busca for curta
            return;
        }

        postsGrid.style.display = 'none'; // Esconde a grade de posts ao buscar
        showSpinner(resultsContainer);

        const { data: users, error } = await supabaseClient.from('profiles').select('id, username, avatar_url').ilike('username', `%${query}%`).neq('id', currentUser.id).limit(10);
        if (error) { resultsContainer.innerHTML = showMessage('Erro ao buscar usuários.', 'error'); return; }

        const { data: followingData } = await supabaseClient.from('followers').select('following_id').eq('follower_id', currentUser.id);
        const followingIds = new Set(followingData.map(f => f.following_id));

        resultsContainer.innerHTML = users.map(user => {
            const isFollowing = followingIds.has(user.id);
            return `
                <div class="p-4 flex items-center justify-between border-b border-gray-100">
                    <div class="flex items-center">
                        <img src="${user.avatar_url || 'https://placehold.co/40x40/ccc/fff?text=' + user.username.charAt(0)}" class="w-10 h-10 rounded-full mr-3">
                        <span class="font-semibold">${user.username}</span>
                    </div>
                    <button data-action="toggle-follow" data-user-id="${user.id}" class="text-white font-semibold text-sm px-4 py-1 rounded-lg ${isFollowing ? 'bg-gray-300 text-gray-800' : 'bg-pink-500'}">${isFollowing ? 'Seguindo' : 'Seguir'}</button>
                </div>
            `;
        }).join('');
        lucide.createIcons();
    };

    const renderNotificationsPage = async () => {
        const notificationsPage = document.getElementById('page-notificacoes');
        showSpinner(notificationsPage);
        const { data: notifications, error } = await supabaseClient
            .from('notifications')
            .select(`*, actor:profiles!notifications_actor_id_fkey(username, avatar_url), posts:posts!post_id(image_url)`)
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) { notificationsPage.innerHTML = showMessage('Erro ao carregar notificações.', 'error'); return; }
        if (!notifications || notifications.length === 0) { notificationsPage.innerHTML = `<p class="text-center text-gray-500 p-8">Nenhuma notificação ainda.</p>`; return; }

        const notificationMessages = {
            like: 'curtiu sua publicação.',
            comment: 'comentou na sua publicação.',
            follow: 'começou a seguir você.'
        };

        notificationsPage.innerHTML = notifications.map(n => `
            <div class="p-4 flex items-center border-b border-gray-100">
                <img src="${n.actor.avatar_url || 'https://placehold.co/40x40/ccc/fff?text=' + n.actor.username.charAt(0)}" class="w-10 h-10 rounded-full mr-3">
                <p class="flex-grow text-sm"><strong>${n.actor.username}</strong> ${notificationMessages[n.type] || 'interagiu com você.'}</p>
                ${n.post_id && n.posts ? `<img src="${SUPABASE_URL}/storage/v1/object/public/posts-images/${n.posts.image_url}" class="w-10 h-10 object-cover rounded-md ml-2">` : ''}
            </div>
        `).join('');
    };

    const renderAnalyzePage = () => {
        const analyzePage = document.getElementById('page-analisar');
        const features = [
            { 
                action: 'open-look-analysis', 
                icon: 'scan-search', 
                title: 'Análise de Look', 
                description: 'Receba um feedback de estilo detalhado sobre o seu look enviando uma foto.' 
            },
            { 
                action: 'open-wardrobe-catalog', 
                icon: 'book-open-check', 
                title: 'Catalogação do Guarda-Roupa', 
                description: 'Organize seu guarda-roupa digital. A I.A. atribui etiquetas automáticas às suas peças.' 
            },
            { 
                action: 'open-outfit-builder', 
                icon: 'shirt', 
                title: 'Montador de Looks', 
                description: 'Cria combinações e sugere o "Look do Dia" com base no clima e no seu estilo.' 
            },
            { 
                action: 'open-color-analysis', 
                icon: 'palette', 
                title: 'Análise de Coloração Pessoal', 
                description: 'Descubra sua paleta de cores ideal enviando uma selfie com luz natural.' 
            },
            { 
                action: 'open-trip-planner', 
                icon: 'briefcase', 
                title: 'Planejador de Viagem', 
                description: 'Monte uma mala de viagem otimizada com o máximo de looks e o mínimo de peças.' 
            }
        ];

        analyzePage.innerHTML = `
            <div class="p-4">
                <h2 class="text-2xl font-bold mb-4 px-2">Ferramentas de Estilo</h2>
                <div class="space-y-3">
                    ${features.map(feature => `
                        <div data-action="${feature.action}" class="bg-gray-50 rounded-xl p-4 flex items-start space-x-4 cursor-pointer hover:bg-gray-100 transition-colors">
                            <i data-lucide="${feature.icon}" class="w-8 h-8 text-pink-500 shrink-0 mt-1"></i>
                            <div>
                                <h3 class="font-semibold">${feature.title}</h3>
                                <p class="text-sm text-gray-600">${feature.description}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        lucide.createIcons();
    };

    const showFeatureComingSoon = (featureName) => {
        openModal(`
            <div class="p-6 text-center">
                <h2 class="text-xl font-bold mb-4">Em Breve!</h2>
                <p class="text-gray-600">A funcionalidade <strong>${featureName}</strong> está em desenvolvimento e será lançada em breve para revolucionar seu estilo!</p>
                <button data-action="close-modal" class="mt-6 w-full bg-gray-200 text-gray-800 font-semibold py-2 rounded-lg">Entendi</button>
            </div>
        `);
    };

    const openWardrobeCatalogFlow = () => {
        openModal(`
            <div class="p-6 text-center">
                <h2 class="text-xl font-bold mb-4">Catalogar Peça</h2>
                <p class="text-gray-500 mb-6">Adicione uma foto de uma peça de roupa para que nossa I.A. a categorize automaticamente.</p>
                <input type="file" id="wardrobe-image-input" class="hidden" accept="image/*">
                <button id="select-wardrobe-image-btn" class="w-full bg-pink-500 text-white font-semibold py-3 rounded-lg shadow-md">Adicionar Peça</button>
                <button data-action="close-modal" class="mt-2 text-gray-500 text-sm">Cancelar</button>
            </div>
        `);
        document.getElementById('select-wardrobe-image-btn').addEventListener('click', () => document.getElementById('wardrobe-image-input').click());
        document.getElementById('wardrobe-image-input').addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                openModal(`<div class="p-8 text-center flex flex-col items-center justify-center min-h-[250px]"><div class="spinner mb-4"></div><p class="text-gray-600">Catalogando peça...</p></div>`);
                setTimeout(() => {
                    openModal(`
                        <div class="p-6">
                            <h2 class="text-xl font-bold text-center mb-4">Peça Catalogada!</h2>
                            <p class="text-center text-gray-600 mb-4">A I.A. identificou as seguintes características:</p>
                            <div class="bg-gray-100 p-4 rounded-lg text-sm space-y-2">
                                <p><strong>Categoria:</strong> Camiseta</p>
                                <p><strong>Cor Principal:</strong> Branca</p>
                                <p><strong>Estilo:</strong> Casual</p>
                                <p><strong>Estampa:</strong> Lisa</p>
                            </div>
                            <button data-action="close-modal" class="mt-6 w-full bg-pink-500 text-white font-semibold py-2 rounded-lg">Concluir</button>
                        </div>
                    `);
                }, 2000);
            }
        });
    };

    const openOutfitBuilderFlow = () => {
        openModal(`
            <div class="p-6">
                <h2 class="text-xl font-bold text-center mb-4">Montador de Looks</h2>
                <p class="text-gray-600 mb-6 text-center">Para qual ocasião você precisa de um look?</p>
                <div class="flex flex-col space-y-2">
                    <button data-occasion="Trabalho" class="w-full bg-gray-200 text-gray-800 font-semibold py-2 rounded-lg">Trabalho</button>
                    <button data-occasion="Festa" class="w-full bg-gray-200 text-gray-800 font-semibold py-2 rounded-lg">Festa</button>
                    <button data-occasion="Casual" class="w-full bg-gray-200 text-gray-800 font-semibold py-2 rounded-lg">Dia a Dia</button>
                    <button data-occasion="Look do Dia" class="w-full bg-pink-500 text-white font-semibold py-2 rounded-lg mt-2">Look do Dia (Clima)</button>
                </div>
            </div>
        `);
        document.querySelectorAll('[data-occasion]').forEach(button => {
            button.addEventListener('click', () => {
                openModal(`<div class="p-8 text-center flex flex-col items-center justify-center min-h-[250px]"><div class="spinner mb-4"></div><p class="text-gray-600">Montando seu look para <strong>${button.dataset.occasion}</strong>...</p></div>`);
                setTimeout(() => {
                    openModal(`
                        <div class="p-6">
                            <h2 class="text-xl font-bold text-center mb-4">Sugestão de Look</h2>
                            <div class="bg-gray-100 p-4 rounded-lg text-sm space-y-2">
                                <p><strong>Parte de Cima:</strong> Blusa de seda preta</p>
                                <p><strong>Parte de Baixo:</strong> Calça de alfaiataria bege</p>
                                <p><strong>Calçado:</strong> Scarpin preto</p>
                                <p><strong>Acessório:</strong> Colar dourado delicado</p>
                            </div>
                            <button data-action="close-modal" class="mt-6 w-full bg-pink-500 text-white font-semibold py-2 rounded-lg">Adorei!</button>
                        </div>
                    `);
                }, 2000);
            });
        });
    };

    const openColorAnalysisFlow = () => {
        openModal(`
            <div class="p-6 text-center">
                <h2 class="text-xl font-bold mb-4">Análise de Coloração</h2>
                <p class="text-gray-500 mb-6">Envie uma selfie com luz natural e sem maquiagem para descobrirmos sua paleta de cores ideal.</p>
                <input type="file" id="selfie-image-input" class="hidden" accept="image/*" capture="user">
                <button id="select-selfie-btn" class="w-full bg-pink-500 text-white font-semibold py-3 rounded-lg shadow-md">Enviar Selfie</button>
                <button data-action="close-modal" class="mt-2 text-gray-500 text-sm">Cancelar</button>
            </div>
        `);
        document.getElementById('select-selfie-btn').addEventListener('click', () => document.getElementById('selfie-image-input').click());
        document.getElementById('selfie-image-input').addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                openModal(`<div class="p-8 text-center flex flex-col items-center justify-center min-h-[250px]"><div class="spinner mb-4"></div><p class="text-gray-600">Analisando seus tons...</p></div>`);
                setTimeout(() => {
                    openModal(`
                        <div class="p-6">
                            <h2 class="text-xl font-bold text-center mb-4">Sua Paleta de Cores</h2>
                            <p class="text-center text-gray-600 mb-1">Sua estação é:</p>
                            <p class="text-center font-bold text-lg mb-4">Inverno Frio</p>
                            <div class="grid grid-cols-4 gap-2 h-24">
                                <div class="rounded-lg bg-blue-900"></div>
                                <div class="rounded-lg bg-pink-500"></div>
                                <div class="rounded-lg bg-gray-800"></div>
                                <div class="rounded-lg bg-white border"></div>
                                <div class="rounded-lg bg-red-600"></div>
                                <div class="rounded-lg bg-purple-700"></div>
                                <div class="rounded-lg bg-emerald-500"></div>
                                <div class="rounded-lg bg-gray-400"></div>
                            </div>
                            <button data-action="close-modal" class="mt-6 w-full bg-pink-500 text-white font-semibold py-2 rounded-lg">Entendi</button>
                        </div>
                    `);
                }, 2000);
            }
        });
    };

    const openTripPlannerFlow = () => {
        openModal(`
            <div class="p-6">
                <h2 class="text-xl font-bold text-center mb-4">Planejador de Viagem</h2>
                <div class="space-y-3">
                    <div>
                        <label class="text-sm font-medium">Destino</label>
                        <input id="trip-destination" type="text" placeholder="Ex: Paris, França" class="w-full p-2 border rounded-lg">
                    </div>
                    <div>
                        <label class="text-sm font-medium">Duração (dias)</label>
                        <input id="trip-duration" type="number" placeholder="Ex: 7" class="w-full p-2 border rounded-lg">
                    </div>
                </div>
                <button id="plan-trip-btn" class="mt-6 w-full bg-pink-500 text-white font-semibold py-2 rounded-lg">Planejar Mala</button>
            </div>
        `);
        document.getElementById('plan-trip-btn').addEventListener('click', () => {
            const planTripButton = document.getElementById('plan-trip-btn');
            planTripButton.disabled = true;
            planTripButton.innerHTML = '<div class="spinner mx-auto !w-6 !h-6 !border-2 !border-l-white"></div>';

            const runTripPlanner = async () => {
                try {
                    const destination = document.getElementById('trip-destination').value;
                    const duration = document.getElementById('trip-duration').value || 7;
                    if (!destination) {
                        alert('Por favor, informe o destino.');
                        planTripButton.disabled = false;
                        planTripButton.textContent = 'Planejar Mala';
                        return;
                    }

                    // 1. Buscar coordenadas do destino
                    const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1&language=pt&format=json`);
                    const geoData = await geoResponse.json();
                    if (!geoData.results) throw new Error('Não foi possível encontrar o destino.');
                    const { latitude, longitude } = geoData.results[0];

                    // 2. Buscar previsão do tempo
                    const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min&forecast_days=${duration}`);
                    const weatherData = await weatherResponse.json();
                    const avgTemp = (weatherData.daily.temperature_2m_max.reduce((a, b) => a + b, 0) / duration).toFixed(0);

                    openModal(`<div class="p-8 text-center flex flex-col items-center justify-center min-h-[250px]"><div class="spinner mb-4"></div><p class="text-gray-600">A I.A. está montando sua mala para <strong>${destination}</strong> (aprox. ${avgTemp}°C)...</p></div>`);

                    // 3. Gerar lista com I.A.
                    const generator = await pipeline('text-generation', 'Xenova/gpt2');
                    const prompt = `Crie uma lista de roupas otimizada para uma viagem de ${duration} dias para ${destination}, com temperatura média de ${avgTemp}°C. A lista deve ser versátil, com o formato: "Partes de Cima: [itens]. Partes de Baixo: [itens]. Casacos: [itens]. Calçados: [itens]."`;
                    const output = await generator(prompt, { max_new_tokens: 100, num_return_sequences: 1 });
                    const generatedText = output[0].generated_text;

                    // 4. Exibir resultado
                    const formattedResult = generatedText.replace(/Partes de Cima:|Partes de Baixo:|Casacos:|Calçados:/g, (match) => `<br><strong>${match}</strong>`).trim();
                    openModal(`
                        <div class="p-6">
                            <h2 class="text-xl font-bold text-center mb-4">Mala Inteligente</h2>
                            <div class="bg-gray-100 p-4 rounded-lg text-sm space-y-2">
                                <p>${formattedResult}</p>
                            </div>
                            <button data-action="close-modal" class="mt-6 w-full bg-pink-500 text-white font-semibold py-2 rounded-lg">Perfeito!</button>
                        </div>
                    `);
                } catch (error) {
                    alert('Ocorreu um erro ao planejar a viagem: ' + error.message);
                    planTripButton.disabled = false;
                    planTripButton.textContent = 'Planejar Mala';
                }
            };
            runTripPlanner();
        });
    };

    const openLookAnalysisFlow = () => {
        openModal(`
            <div class="p-6 text-center">
                <h2 class="text-xl font-bold mb-4">Análise de Look com I.A.</h2>
                <p class="text-gray-500 mb-6">Envie uma foto do seu look para receber um feedback de estilo detalhado.</p>
                <p class="text-sm text-gray-600 mb-4"><strong>Dica:</strong> Para uma análise precisa, use fotos nítidas que mostrem bem o look completo.</p>
                <input type="file" id="analysis-image-input" class="hidden" accept="image/*">
                <button id="select-analysis-image-btn" class="w-full bg-pink-500 text-white font-semibold py-3 rounded-lg shadow-md">Selecionar Imagem</button>
                <button data-action="close-modal" class="mt-2 text-gray-500 text-sm">Cancelar</button>
            </div>
        `);
        document.getElementById('select-analysis-image-btn').addEventListener('click', () => document.getElementById('analysis-image-input').click());
        document.getElementById('analysis-image-input').addEventListener('change', (e) => { if (e.target.files && e.target.files[0]) showAnalysisStep2(e.target.files[0]); });
    };

    const showAnalysisStep2 = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            openModal(`
                <div class="p-6">
                    <h2 class="text-xl font-bold text-center mb-4">Prévia do Look</h2>
                    <img id="analysis-preview" src="${e.target.result}" class="w-full rounded-lg mb-4 max-h-64 object-contain bg-gray-100">
                    <div class="flex space-x-2">
                        <button data-action="close-modal" class="w-1/2 bg-gray-200 text-gray-800 font-semibold py-2 rounded-lg">Cancelar</button>
                        <button id="analyze-btn" class="w-1/2 bg-pink-500 text-white font-semibold py-2 rounded-lg">Analisar</button>
                    </div>
                </div>
            `);
            document.getElementById('analyze-btn').addEventListener('click', () => performAnalysis(file));
        };
        reader.readAsDataURL(file);
    };
    
    const performAnalysis = async (file) => {
        try {
            // Mostra o spinner enquanto a análise é feita no servidor.
            openModal(`
                <div class="p-8 text-center flex flex-col items-center justify-center min-h-[250px]">
                    <div class="spinner mb-4"></div>
                    <p class="text-gray-600">Nossa I.A. está analisando seu look...</p>
                </div>
            `);

            // Converte a imagem para base64 para enviá-la para a Edge Function.
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async (event) => {
                try {
                    const imageBase64 = event.target.result;

                    // Chama a Supabase Edge Function 'analyze-look'
                    const { data: results, error } = await supabaseClient.functions.invoke('analyze-look', {
                        body: JSON.stringify({ image: imageBase64 }),
                    });

                    if (error) {
                        throw error; // Lança o erro para ser pego pelo catch externo.
                    }

                    // Exibe os resultados retornados pela Edge Function.
                    showAnalysisResults(results);
                } catch (error) {
                    console.error('Erro ao invocar a Edge Function:', error);
                    openModal(showMessage(`<p><strong>Ops!</strong> A I.A. está tirando um cochilo. Tente novamente mais tarde.</p><p class="text-xs mt-2">${error.message}</p>`, 'error'));
                }
            };
        } catch (error) {
            console.error('Erro no processo de análise:', error);
            openModal(showMessage(`<p><strong>Ops!</strong> A I.A. está tirando um cochilo. Tente novamente mais tarde.</p><p class="text-xs mt-2">${error.message}</p>`, 'error'));
        }
    };

    const showAnalysisResults = (results) => {
        const resultsHtml = `
            <div class="p-6">
                <h2 class="text-xl font-bold text-center mb-5">Resultado da Análise</h2>
                <div class="space-y-4 text-sm">
                    ${results.pontos_fortes ? `<div><h3 class="font-semibold text-green-600 flex items-center"><i data-lucide="check-circle" class="w-4 h-4 mr-2"></i>Pontos Fortes</h3><p class="text-gray-700 pl-6">${results.pontos_fortes}</p></div>` : ''}
                    ${results.pontos_atencao ? `<div><h3 class="font-semibold text-orange-500 flex items-center"><i data-lucide="alert-triangle" class="w-4 h-4 mr-2"></i>Pontos de Atenção</h3><p class="text-gray-700 pl-6">${results.pontos_atencao}</p></div>` : ''}
                    ${results.sugestao_melhoria ? `<div><h3 class="font-semibold text-blue-500 flex items-center"><i data-lucide="lightbulb" class="w-4 h-4 mr-2"></i>Sugestão de Melhoria</h3><p class="text-gray-700 pl-6">${results.sugestao_melhoria}</p></div>` : ''}
                    ${results.dica_extra ? `<div><h3 class="font-semibold text-purple-500 flex items-center"><i data-lucide="sparkles" class="w-4 h-4 mr-2"></i>Dica Extra</h3><p class="text-gray-700 pl-6">${results.dica_extra}</p></div>` : ''}
                </div>
                <button data-action="close-modal" class="mt-8 w-full bg-pink-500 text-white font-semibold py-2 rounded-lg">Ótimo!</button>
            </div>`;
        openModal(resultsHtml);
    };
    
    const showComingSoon = () => {
        openModal(`
            <div class="p-6 text-center">
                <h2 class="text-xl font-bold mb-4">Em Breve!</h2>
                <p class="text-gray-600">Esta funcionalidade está em desenvolvimento e será lançada em breve.</p>
                <button data-action="close-modal" class="mt-6 w-full bg-gray-200 text-gray-800 font-semibold py-2 rounded-lg">Entendi</button>
            </div>
        `);
    };

    const openDeletePostModal = (postId) => {
        openModal(`
            <div class="p-6 text-center">
                <h2 class="text-xl font-bold mb-2">Excluir Post?</h2>
                <p class="text-gray-600 mb-6">Você tem certeza que deseja excluir este post permanentemente?</p>
                <div class="flex flex-col space-y-2">
                    <button data-action="delete-post" data-post-id="${postId}" class="w-full bg-red-500 text-white font-semibold py-2 rounded-lg">Excluir</button>
                    <button data-action="close-modal" class="w-full bg-gray-200 text-gray-800 font-semibold py-2 rounded-lg">Cancelar</button>
                </div>
            </div>
        `);
    };

    const handleDeletePost = async (buttonElement) => {
        const postId = buttonElement.dataset.postId;
        buttonElement.disabled = true;
        buttonElement.innerHTML = '<div class="spinner mx-auto !w-6 !h-6 !border-2 !border-l-white"></div>';

        // A política de segurança no Supabase garante que só o dono pode deletar.
        const { error } = await supabaseClient.from('posts').delete().match({ id: postId });

        if (error) {
            alert(`Erro ao excluir o post: ${error.message}`);
            closeModal();
        } else {
            closeModal();
            closePostDetailModal(); // Fecha também o modal de detalhe, se estiver aberto
            document.querySelector(`[data-post-container-id="${postId}"]`)?.remove();
        }
    };

    const openEditProfileModal = async () => {
        const { data: profile } = await supabaseClient.from('profiles').select('*').eq('id', currentUser.id).single();
        openModal(`<div id="edit-profile-form" class="p-6">
            <div class="p-6">
                <h2 class="text-xl font-bold text-center mb-4">Editar Perfil</h2>
                <div class="flex flex-col items-center mb-4">
                    <img id="current-avatar-preview" src="${profile.avatar_url || 'https://placehold.co/100x100/ccc/fff?text=' + (profile.username ? profile.username.charAt(0) : '?')}" class="w-24 h-24 rounded-full object-cover mb-2">
                    <input type="file" id="avatar-upload-input" class="hidden" accept="image/*">
                    <button id="change-avatar-btn" class="text-pink-500 text-sm font-semibold">Alterar Foto</button>
                </div>

                <label class="text-sm font-medium">Nome de usuário</label>
                <input id="edit-username" type="text" value="${profile.username || ''}" class="w-full p-2 border rounded-lg mb-3">
                <label class="text-sm font-medium">Bio</label>
                <textarea id="edit-bio" class="w-full p-2 border rounded-lg mb-3" rows="3">${profile.bio || ''}</textarea>
                <label class="text-sm font-medium">Site</label>
                <input id="edit-website" type="text" value="${profile.website_url || ''}" class="w-full p-2 border rounded-lg mb-3">
                <label class="text-sm font-medium">Gênero</label>
                <select id="edit-gender" class="w-full p-2 border rounded-lg mb-4 bg-white">
                    <option value="Feminino" ${profile.gender === 'Feminino' ? 'selected' : ''}>Feminino</option>
                    <option value="Masculino" ${profile.gender === 'Masculino' ? 'selected' : ''}>Masculino</option>
                    <option value="Nao-binario" ${profile.gender === 'Nao-binario' ? 'selected' : ''}>Não-binário</option>
                    <option value="Prefiro não informar" ${!profile.gender || profile.gender === 'Prefiro não informar' || profile.gender === 'Não-binário' ? 'selected' : ''}>Prefiro não informar</option>
                </select>
                <div class="flex space-x-2">
                    <button data-action="close-modal" class="w-full bg-gray-200 text-gray-800 font-semibold py-2 rounded-lg">Cancelar</button>
                    <button data-action="save-profile" class="w-full bg-pink-500 text-white font-semibold py-2 rounded-lg">Salvar</button>
                </div>
            </div>
        `);
        // Adiciona event listeners para o upload de avatar APÓS o modal ser aberto
        document.getElementById('change-avatar-btn').addEventListener('click', () => document.getElementById('avatar-upload-input').click());
        document.getElementById('avatar-upload-input').addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                handleAvatarUpload(e.target.files[0]);
            }
        });
    };
    
    const handleAvatarUpload = async (file) => {
        const currentAvatarPreview = document.getElementById('current-avatar-preview');
        const changeAvatarBtn = document.getElementById('change-avatar-btn');
        const originalBtnText = changeAvatarBtn.textContent;

        changeAvatarBtn.disabled = true;
        changeAvatarBtn.innerHTML = '<div class="spinner mx-auto !w-4 !h-4 !border-2 !border-l-white"></div>'; // Spinner menor

        try {
            const fileExtension = file.name.split('.').pop();
            // Cria um caminho único para o avatar do usuário, sobrescrevendo o anterior se existir
            const filePath = `${currentUser.id}/avatar.${fileExtension}`;

            // Upload para o Supabase Storage (bucket 'avatars')
            const { error: uploadError } = await supabaseClient.storage.from('avatars').upload(filePath, file, {
                upsert: true // Sobrescreve se o avatar já existe
            });
            if (uploadError) throw uploadError;

            // Obtém a URL pública da imagem
            const { data: publicUrlData } = supabaseClient.storage.from('avatars').getPublicUrl(filePath);
            const newAvatarUrl = publicUrlData.publicUrl;

            // Atualiza a tabela 'profiles' com a nova URL do avatar
            const { error: updateError } = await supabaseClient.from('profiles').update({ avatar_url: newAvatarUrl }).eq('id', currentUser.id);
            if (updateError) throw updateError;

            currentAvatarPreview.src = newAvatarUrl; // Atualiza a prévia no modal
            alert('Foto de perfil atualizada com sucesso!');

        } catch (error) {
            console.error('Erro ao fazer upload da foto de perfil:', error);
            alert('Erro ao atualizar foto de perfil: ' + error.message);
        } finally {
            changeAvatarBtn.disabled = false;
            changeAvatarBtn.textContent = originalBtnText;
        }
    };
    
    const handleUpdateProfile = async () => {
        const username = document.getElementById('edit-username').value;
        const bio = document.getElementById('edit-bio').value;
        const website_url = document.getElementById('edit-website').value;
        const gender = document.getElementById('edit-gender').value;
        const { error } = await supabaseClient.from('profiles').update({ username, bio, website_url, gender }).eq('id', currentUser.id);
        if (error) { alert(`Erro ao atualizar: ${error.message}`); }
        else {
            closeModal();
            renderUserProfile(currentUser); // Recarrega o perfil para mostrar as mudanças
        }
    };

    const openPostModal = () => {
        openModal(`
            <div class="p-6 text-center">
                <h2 class="text-xl font-bold mb-4">Criar Novo Post</h2>
                <p class="text-gray-500 mb-6">Selecione uma imagem do seu dispositivo.</p>
                <input type="file" id="post-image-input" class="hidden" accept="image/*">
                <button id="select-image-btn" class="w-full bg-pink-500 text-white font-semibold py-3 rounded-lg shadow-md">Selecionar Imagem</button>
                <button data-action="close-modal" class="mt-2 text-gray-500 text-sm">Cancelar</button>
            </div>
        `);
        document.getElementById('select-image-btn').addEventListener('click', () => document.getElementById('post-image-input').click());
        document.getElementById('post-image-input').addEventListener('change', (e) => { if (e.target.files && e.target.files[0]) showPostStep2(e.target.files[0]); });
    };
    
    const showPostStep2 = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            openModal(`
                <div class="p-6">
                    <h2 class="text-xl font-bold text-center mb-4">Prévia do Post</h2>
                    <img id="post-preview" src="${e.target.result}" class="w-full rounded-lg mb-4 max-h-48 object-cover">
                    <textarea id="post-caption" class="w-full p-2 border rounded-lg mb-4" placeholder="Escreva uma legenda..."></textarea>
                    <div class="flex space-x-2">
                        <button data-action="close-modal" class="w-1/2 bg-gray-200 text-gray-800 font-semibold py-2 rounded-lg">Cancelar</button>
                        <button id="publish-btn" class="w-1/2 bg-pink-500 text-white font-semibold py-2 rounded-lg">Publicar</button>
                    </div>
                </div>
            `);
            document.getElementById('publish-btn').addEventListener('click', () => handlePublish(file));
        };
        reader.readAsDataURL(file);
    };
    const handlePublish = async (file) => {
        const caption = document.getElementById('post-caption').value;
        const publishBtn = document.getElementById('publish-btn');
        publishBtn.disabled = true;
        publishBtn.innerHTML = '<div class="spinner mx-auto !w-6 !h-6 !border-2 !border-l-white"></div>';

        const sanitizeFilename = (filename) => {
            // Remove acentos e caracteres especiais para criar um nome de arquivo seguro.
            const sanitized = filename.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            return sanitized.replace(/[^a-zA-Z0-9.\-_]/g, '-').replace(/\s+/g, '-');
        };

        const cleanFileName = sanitizeFilename(file.name);
        const filePath = `${currentUser.id}/${Date.now()}-${cleanFileName}`;
        try {
            const { error: uploadError } = await supabaseClient.storage.from('posts-images').upload(filePath, file);
            if (uploadError) throw uploadError;
            const { error: insertError } = await supabaseClient.from('posts').insert({ user_id: currentUser.id, image_url: filePath, caption: caption });
            if (insertError) throw insertError;
            closeModal();
            await renderFeed();
        } catch (error) {
            alert(`Erro ao publicar: ${error.message}\n\nCertifique-se de que executou o script de segurança do Storage no Supabase.`);
            publishBtn.disabled = false;
            publishBtn.innerText = 'Publicar';
        }
    };

    const showPage = (pageId, title) => {
        const isSubPage = ['comments'].includes(pageId);

        mainHeader.classList.toggle('hidden', isSubPage);
        pageHeader.classList.toggle('hidden', !isSubPage);

        if (isSubPage) {
            pageHeaderTitle.textContent = title;
        }

        pages.forEach(page => page.classList.remove('active'));
        document.getElementById(`page-${pageId}`).classList.add('active');
    };

    const updateUIForSession = async (session) => {
        currentUser = session?.user;
        if (currentUser) {
            authScreen.style.display = 'none';
            appContent.classList.remove('hidden');
            appContent.style.display = 'flex';
            // Renderiza todas as páginas principais
            await Promise.all([
                renderFeed(), 
                renderUserProfile(currentUser),
                renderExplorePage(),
                renderAnalyzePage()
            ]);
        } else {
            appContent.style.display = 'none';
            authScreen.style.display = 'flex';
            showLoginForm();
        }
        lucide.createIcons();
    };

    const initialize = () => {
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
        window.supabaseClient = supabaseClient; // Expondo o cliente para depuração no console
        addEventListeners();
        supabaseClient.auth.onAuthStateChange((_event, session) => {
            updateUIForSession(session);
        });
        supabaseClient.auth.getSession().then(({ data: { session } }) => {
            updateUIForSession(session);
        });
    };
    
    const addEventListeners = () => {
        document.body.addEventListener('click', (e) => {
            const element = e.target.closest('[data-action]'); // Procura o elemento clicado ou um pai com data-action
            if (!element) return;

            const action = element.dataset.action;
            const actions = {
                'save-post': () => handleSavePost(element),
                'like-post': () => handleLikePost(element),
                'close-modal': closeModal,
                'open-delete-modal': () => openDeletePostModal(element.dataset.postId),
                'delete-post': () => handleDeletePost(element),
                'open-edit-profile': openEditProfileModal,
                'save-profile': handleUpdateProfile,
                'open-post-detail': () => openPostDetailView(element.dataset.postId),
                'close-post-detail': closePostDetailModal,
                'open-post-options': () => openPostOptionsModal(element),
                'open-edit-caption': () => openEditCaptionModal(element),
                'save-caption': () => handleUpdateCaption(element),
                'show-coming-soon': showComingSoon,
                'close-overlay-modal': closeOverlayModal,
                'open-comments': () => openCommentsPage(element.dataset.postId),
                'delete-comment': () => handleDeleteComment(element),
                'like-comment': () => handleLikeComment(element),
                'toggle-follow': () => handleToggleFollow(element),
                'open-look-analysis': openLookAnalysisFlow,
                'open-wardrobe-catalog': openWardrobeCatalogFlow,
                'open-outfit-builder': openOutfitBuilderFlow,
                'open-color-analysis': openColorAnalysisFlow,
                'open-trip-planner': openTripPlannerFlow,
            };
            if (actions[action]) {
                actions[action]();
            }
        });

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const pageId = `page-${button.dataset.page}`;
                const pageName = button.dataset.page;
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                pages.forEach(page => page.classList.remove('active'));
                document.getElementById(pageId).classList.add('active');
                const titles = { feed: 'OUTFY', explorar: 'Explorar', analisar: 'Analisar Look', notificacoes: 'Notificações', perfil: 'Perfil' };
                headerTitle.textContent = titles[button.dataset.page] || 'OUTFY';
                mainHeader.classList.remove('hidden');
                pageHeader.classList.add('hidden');
            });
        });
        postButton.addEventListener('click', openPostModal);
        notificationButton.addEventListener('click', () => {
            // Abre a página de notificações e atualiza o conteúdo
            const notifPage = document.getElementById('page-notificacoes');
            pages.forEach(p => p.classList.remove('active'));
            notifPage.classList.add('active');
            headerTitle.textContent = 'Notificações';
            // Desativa todas as abas do rodapé, pois notificações é uma ação do cabeçalho
            tabButtons.forEach(btn => btn.classList.remove('active'));
            renderNotificationsPage();
        });

        backButton.addEventListener('click', () => {
            // Por enquanto, o back button sempre volta para o feed.
            // Isso pode ser melhorado no futuro com um histórico de navegação.
            showPage('feed');
            document.querySelector('.tab-btn[data-page="feed"]').classList.add('active');
        });

        // Fecha o modal genérico ao clicar no fundo
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer) {
                closeModal();
            }
        });
        // Fecha o modal de detalhe do post ao clicar no fundo
        postDetailModal.addEventListener('click', (e) => {
            if (e.target === postDetailModal) {
                closePostDetailModal();
            }
        });

        // Fecha o modal de sobreposição ao clicar no fundo
        overlayModal.addEventListener('click', (e) => {
            if (e.target === overlayModal) {
                closeOverlayModal();
            }
        });
    };
    
    initialize();
});