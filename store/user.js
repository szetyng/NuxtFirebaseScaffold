import { auth, firestoreDB, persistencetype, GoogleProvider, FacebookProvider, LinkedInProvider } from '@/firebase/init.js';

// UID is also the DocumentID for the firestore User document 
const getDefaultState = () => {
	return {
		displayName: null,
		uid: null,
		email: null,
		emailVerified: null,
		onboarded: null,
		isAnonymous: null,
		photoURL: null,
	};
};


export const state = () => getDefaultState();

export const getters = {
	isAuthenticated(state) {
		return state.uid != null;
	},
	isEmailVerified(state) {
		return state.emailVerified != null;
	},
	isOnboarded(state) {
		return state.onboarded != null;
	}
};

export const mutations = {
	SET_USER_AUTH(state, user) {
		// For Firebase user auth
		state.email = user.email;
		state.emailVerified = user.emailVerified;
		state.uid = user.uid;
	},
	UNSET_USER_AUTH(state) {
		// For Firebase user auth
		state.email = null;
		state.emailVerified = null;
		state.uid = null;
	},

	SET_USER_DETAILS(state, userData) {
		// For other user data from firestore		
		Object.assign(state, userData);

	},
	UNSET_USER_DETAILS(state) {
		// For other user data from firestore
		Object.assign(state, getDefaultState());
	}

};

export const actions = {
	// Use firebase SDK to switch to a login state - happens at the login page
	authLogin({ commit, dispatch }, credentials) {
		auth.setPersistence(persistencetype);
		return auth.signInWithEmailAndPassword(
			credentials.email,
			credentials.password
		);
	},

	// Use firebase sdk to switch to a signout state - happens at the logout button on the navbar
	authLogout({ dispatch }) {
		return auth.signOut();
	},

	signInWithGoogle({ commit }) {
		return new Promise((resolve, reject) => {
			auth.signInWithRedirect(GoogleProvider);
			resolve();
		});
	},
	signInWithFacebook({ commit }) {
		return new Promise((resolve, reject) => {
			auth.signInWithRedirect(FacebookProvider);
			resolve();
		});
	},
	signInWithLinkedIn({ commit }) {
		return new Promise((resolve, reject) => {
			auth.signInWithRedirect(LinkedInProvider);
			resolve();
		});
	},

	/**
	 * Called by `plugins/fireauth.js` onStateChanged listener, to request for user profile from Firestore
	 * 
	 * @param {*} user from Fireauth
	 */
	authSuccess({ commit }, user) {
		// Commit Firesbase Auth details
		commit('SET_USER_AUTH', user);

		// Fetch additional user data from Firestore and 
		// commit results in store too
		firestoreDB
			.collection('Users')
			.doc(user.uid)
			.get()
			.then(doc => {
				if (doc.exists) {
					const data = doc.data();
					commit('SET_USER_DETAILS', data);
				} else {
					console.error(`User not found in Firestore: ${user}`)
				}
			})
			.catch(err => {
				alert('Failed to fetch user data.');
			})
	},

	/**
	 * Called by `plugins/fireauth.js` onStateChanged listener, to clear user data upon logout
	 */
	authLogoutSuccess({ commit }) {
		commit('UNSET_USER_AUTH');
		commit('UNSET_USER_DETAILS');
	}
};
