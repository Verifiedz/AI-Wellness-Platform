/**
 * Deep linking configuration for React Navigation.
 *
 * URL scheme: sakina://
 *
 * Supported paths:
 *   /chat                  → Sakina tab → AIChatConversation (new conversation)
 *   /chat/:sessionId       → Sakina tab → AIChatConversation with sessionId
 *   /journal               → Journal tab → JournalHome
 *   /community             → Community tab → CommunityHome
 *   /community/:slug       → Community tab → GroupFeed with slug param
 *   /settings              → Profile tab → Settings
 *   /breathing             → Home tab → BreathingExercise
 *   /assessment/:type      → Home tab → Assessment with assessmentType param
 *
 * Auth guard is handled by AppNavigator — if the user is not authenticated,
 * the linking config is still defined but the auth screen will render instead.
 */

const linking = {
  prefixes: ['sakina://', 'https://sakina.app'],

  config: {
    screens: {
      // Bottom tabs (MainTabs)
      Home: {
        screens: {
          HomeScreen: 'home',
          BreathingExercise: 'breathing',
          Assessment: {
            path: 'assessment/:assessmentType',
          },
        },
      },
      Journal: {
        screens: {
          JournalHome: 'journal',
        },
      },
      Community: {
        screens: {
          CommunityHome: 'community',
          GroupFeed: {
            path: 'community/:slug',
          },
        },
      },
      Sakina: {
        screens: {
          ChatDrawer: {
            screens: {
              AIChatConversation: {
                path: 'chat/:sessionId?',
              },
            },
          },
        },
      },
      Profile: {
        screens: {
          Settings: 'settings',
        },
      },
    },
  },
};

export default linking;
