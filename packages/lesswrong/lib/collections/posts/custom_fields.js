import { Posts } from "meteor/example-forum";
import ReactDOMServer from 'react-dom/server';
import { Components, Connectors } from 'meteor/vulcan:core';
import React from 'react';
import Users from "meteor/vulcan:users";
import { makeEditable } from '../../editor/make_editable.js'

export const formGroups = {
  adminOptions: {
    name: "adminOptions",
    order: 25,
    label: "Admin Options",
    startCollapsed: true,
  },
  event: {
    name: "event details",
    order: 21,
    label: "Event Details"
  },
  moderationGroup: {
    order: 60,
    name: "moderation",
    label: "Moderation",
    startCollapsed: true,
  },
  options: {
    order:10,
    name: "options",
    label: "Options",
    defaultStyle: true,
    flexStyle: true
  },
  content: {
    order:20,
    name: "Content",
    defaultStyle: true,
  },
  canonicalSequence: {
    order:30,
    name: "canonicalSequence",
    label: "Canonical Sequence",
    startCollapsed: true,
  }
};

Posts.addField([
  /**
    URL (Overwriting original schema)
  */
  {
    fieldName: "url",
    fieldSchema: {
      order: 12,
      control: 'EditUrl',
      placeholder: 'Add a linkpost URL',
      group: formGroups.options
    }
  },
  /**
    Title (Overwriting original schema)
  */
  {
    fieldName: "title",
    fieldSchema: {
      order: 10,
      placeholder: "Title",
      control: 'EditTitle',
    },
  },

  /**
    categoriesIds: Change original Vulcan field to hidden
  */
  {
    fieldName: "categoriesIds",
    fieldSchema: {
      hidden: true,
    }
  },

  /**
    Legacy: Boolean used to indicate that post was imported from old LW database
  */
  {
    fieldName: 'legacy',
    fieldSchema: {
      type: Boolean,
      optional: true,
      hidden: false,
      defaultValue: false,
      viewableBy: ['guests'],
      editableBy: ['admin'],
      insertableBy: ['admin'],
      control: "checkbox",
      order: 12,
      group: formGroups.adminOptions,
    }
  },

  /**
    Legacy ID: ID used in the original LessWrong database
  */
  {
    fieldName: 'legacyId',
    fieldSchema: {
      type: String,
      optional: true,
      hidden: true,
      viewableBy: ['guests'],
      editableBy: ['members'],
      insertableBy: ['members'],
    }
  },

  /**
    Legacy Spam: True if the original post in the legacy LW database had this post
    marked as spam
  */
  {
    fieldName: 'legacySpam',
    fieldSchema: {
      type: Boolean,
      optional: true,
      defaultValue: false,
      hidden: true,
      viewableBy: ['guests'],
      editableBy: ['members'],
      insertableBy: ['members'],
    }
  },

  /**
    Feed Id: If this post was automatically generated by an integrated RSS feed
    then this field will have the ID of the relevant feed
  */
  {
    fieldName: 'feedId',
    fieldSchema: {
      type: String,
      optional: true,
      viewableBy: ['guests'],
      editableBy: ['admins'],
      insertableBy: ['admins'],
      resolveAs: {
        fieldName: 'feed',
        type: 'RSSFeed',
        resolver: (post, args, context) => context.RSSFeeds.findOne({_id: post.feedId}, {fields: context.getViewableFields(context.currentUser, context.RSSFeeds)}),
        addOriginalField: true,
      },
      group: formGroups.adminOptions,
    }
  },

  /**
    Feed Link: If this post was automatically generated by an integrated RSS feed
    then this field will have the link to the original blogpost it was posted from
  */
  {
    fieldName: 'feedLink',
    fieldSchema: {
      type: String,
      optional: true,
      viewableBy: ['guests'],
      editableBy: ['admins'],
      insertableBy: ['admins'],
      group: formGroups.adminOptions
    }
  },

  /**
    legacyData: A complete dump of all the legacy data we have on this post in a
    single blackbox object. Never queried on the client, but useful for a lot
    of backend functionality, and simplifies the data import from the legacy
    LessWrong database
  */

  {
    fieldName: 'legacyData',
    fieldSchema: {
      type: Object,
      optional: true,
      viewableBy: ['admins'],
      insertableBy: ['admins'],
      editableBy: ['admins'],
      hidden: true,
      blackbox: true,
    }
  },

  /**
    lastVisitDateDefault: Sets the default of what the lastVisit of a post should be, resolves to the date of the last visit of a user, when a user is loggedn in. Returns null when no user is logged in;
  */

  {
    fieldName: 'lastVisitedAtDefault',
    fieldSchema: {
      type: Date,
      optional: true,
      hidden: true,
      viewableBy: ['guests'],
      resolveAs: {
        fieldName: 'lastVisitedAt',
        type: 'Date',
        resolver: async (post, args, { LWEvents, currentUser }) => {
          if(currentUser){
            const event = await Connectors.get(LWEvents, {name:'post-view', documentId: post._id, userId: currentUser._id}, {sort:{createdAt:-1}});
            return event && event.createdAt
          } else {
            return post.lastVisitDateDefault;
          }
        }
      }
    }
  },

  {
    fieldName: 'lastCommentedAt',
    fieldSchema: {
      type: Date,
      optional: true,
      hidden: true,
      viewableBy: ['guests'],
      onInsert: () => {
        return new Date();
      }
    }
  },

  /**
    curatedDate: Date at which the post was promoted to curated (null or false if it never has been promoted to curated)
  */

  {
    fieldName: 'curatedDate',
    fieldSchema: {
      type: Date,
      optional: true,
      viewableBy: ['guests'],
      insertableBy: ['sunshineRegiment', 'admins'],
      editableBy: ['sunshineRegiment', 'admins'],
      group: formGroups.adminOptions,
    }
  },
  /**
    metaDate: Date at which the post was marked as meta (null or false if it never has been marked as meta)
  */

  {
    fieldName: 'metaDate',
    fieldSchema: {
      type: Date,
      optional: true,
      viewableBy: ['guests'],
      insertableBy: ['sunshineRegiment', 'admins'],
      editableBy: ['sunshineRegiment', 'admins'],
      group: formGroups.adminOptions,
    }
  },
  {
    fieldName: 'suggestForCuratedUserIds',
    fieldSchema: {
      type: Array,
      viewableBy: ['members'],
      insertableBy: ['sunshineRegiment', 'admins'],
      editableBy: ['sunshineRegiment', 'admins'],
      optional: true,
      label: "Suggested for Curated by",
      control: "UsersListEditor",
      group: formGroups.adminOptions,
      resolveAs: {
        fieldName: 'suggestForCuratedUsernames',
        type: 'String',
        resolver: (post, args, context) => {
          // TODO - Turn this into a proper resolve field.
          // Ran into weird issue trying to get this to be a proper "users"
          // resolve field. Wasn't sure it actually needed to be anyway,
          // did a hacky thing.
          const users = _.map(post.suggestForCuratedUserIds,
            (userId => {
              return context.Users.findOne({ _id: userId }).displayName
            })
          )
          if (users.length) {
            return users.join(", ")
          } else {
            return null
          }
        },
        addOriginalField: true,
      }
    }
  },
  {
    fieldName: 'suggestForCuratedUserIds.$',
    fieldSchema: {
      type: String,
      optional: true
    }
  },

  /**
    frontpageDate: Date at which the post was promoted to frontpage (null or false if it never has been promoted to frontpage)
  */

  {
    fieldName: 'frontpageDate',
    fieldSchema: {
      type: Date,
      viewableBy: ['guests'],
      editableBy: ['members'],
      insertableBy: ['members'],
      optional: true,
      hidden: true,
    }
  },

  /**
    algoliaIndexAt: The last time at which the post has been indexed in Algolia's search Index.
    Undefined if it is has not been indexed.
  */

  {
    fieldName: 'algoliaIndexAt',
    fieldSchema: {
      type: Date,
      optional: true,
      viewableBy: ['guests'],
    }
  },

  {
    fieldName: 'collectionTitle',
    fieldSchema: {
      type: String,
      optional: true,
      viewableBy: ['guests'],
      editableBy: ['admins'],
      insertableBy: ['admins'],
      group: formGroups.canonicalSequence,
    }
  },

  {
    fieldName: 'userId',
    fieldSchema: {
      type: String,
      optional: true,
      viewableBy: ['guests'],
      editableBy: ['admins'],
      insertableBy: ['admins'],
      hidden: false,
      control: "text",
      group: formGroups.adminOptions,
      resolveAs: {
        fieldName: 'user',
        type: 'User',
        resolver: async (post, args, context) => {
          if (!post.userId || post.hideAuthor) return null;
          const user = await context.Users.loader.load(post.userId);
          if (user.deleted) return null;
          return context.Users.restrictViewableFields(context.currentUser, context.Users, user);
        },
        addOriginalField: true
      },
    }
  },

  {
    fieldName: 'canonicalSequenceId',
    fieldSchema: {
      type: String,
      optional: true,
      viewableBy: ['guests'],
      editableBy: ['admins'],
      insertableBy: ['admins'],
      group: formGroups.canonicalSequence,
      resolveAs: {
        fieldName: 'canonicalSequence',
        addOriginalField: true,
        type: "Sequence",
        resolver: (post, args, context) => {
          if (!post.canonicalSequenceId) return null;
          const sequence = context.Sequences.findOne({_id: post.canonicalSequenceId});
          return Users.restrictViewableFields(context.currentUser, context.Sequences, sequence);
        }
      },
      hidden: false,
      control: "text"
    }
  },

  {
    fieldName: 'canonicalCollectionSlug',
    fieldSchema: {
      type: String,
      optional: true,
      viewableBy: ['guests'],
      editableBy: ['admins'],
      insertableBy: ['admins'],
      hidden: false,
      control: "text",
      group: formGroups.canonicalSequence,
      resolveAs: {
        fieldName: 'canonicalCollection',
        addOriginalField: true,
        type: "Collection",
        resolver: (post, args, context) => {
          if (!post.canonicalCollectionSlug) return null;
          const collection = context.Collections.findOne({slug: post.canonicalCollectionSlug})
          return Users.restrictViewableFields(context.currentUser, context.Collections, collection);
        }
      }
    }
  },

  {
    fieldName: 'canonicalBookId',
    fieldSchema: {
      type: String,
      optional: true,
      viewableBy: ['guests'],
      editableBy: ['admins'],
      insertableBy: ['admins'],
      group: formGroups.canonicalSequence,
      hidden: false,
      control: "text",
      resolveAs: {
        fieldName: 'canonicalBook',
        addOriginalField: true,
        type: "Book",
        resolver: (post, args, context) => {
          if (!post.canonicalBookId) return null;
          const book = context.Books.findOne({_id: post.canonicalBookId});
          return Users.restrictViewableFields(context.currentUser, context.Books, book);
        }
      }
    }
  },

  {
    fieldName: 'canonicalNextPostSlug',
    fieldSchema: {
      type: String,
      optional: true,
      viewableBy: ['guests'],
      editableBy: ['admins'],
      insertableBy: ['admins'],
      group: formGroups.canonicalSequence,
      hidden: false,
      control: "text"
    }
  },

  {
    fieldName: 'canonicalPrevPostSlug',
    fieldSchema: {
      type: String,
      optional: true,
      viewableBy: ['guests'],
      editableBy: ['admins'],
      insertableBy: ['admins'],
      group: formGroups.canonicalSequence,
      hidden: false,
      control: "text"
    }
  },

  /**
    unlisted: If true, the post is not featured on the frontpage and is not featured on the user page. Only accessible via it's ID
  */

  {
    fieldName: 'unlisted',
    fieldSchema: {
      type: Boolean,
      optional: true,
      viewableBy: ['guests'],
      editableBy: ['admins', 'sunshineRegiment'],
      insertableBy: ['admins', 'sunshineRegiment'],
      label: "Make only accessible via link",
      control: "checkbox",
      order: 11,
      group: formGroups.adminOptions,
      onInsert: (document, currentUser) => {
        if (!document.unlisted) {
          return false;
        }
      },
      onEdit: (modifier, post) => {
        if (modifier.$set.unlisted === null || modifier.$unset.unlisted) {
          return false;
        }
      }
    }
  },



  /**
    Drafts
  */
  {
    fieldName: "draft",
    fieldSchema: {
      label: 'Save to Drafts',
      type: Boolean,
      optional: true,
      defaultValue: false,
      viewableBy: ['members'],
      insertableBy: ['members'],
      editableBy: ['members'],
      hidden: true,
    }
  },


  /**
    meta: The post is published to the meta section of the page
  */

  {
    fieldName: 'meta',
    fieldSchema: {
      type: Boolean,
      optional: true,
      viewableBy: ['guests'],
      editableBy: ['members'],
      insertableBy: ['members'],
      hidden: true,
      label: "Publish to meta",
      control: "checkbox",
      onInsert: (document, currentUser) => {
          if (!document.meta) {
            return false
          }
      },
      onEdit: (modifier, post) => {
        if (modifier.$set.meta === null || modifier.$unset.meta) {
          return false;
        }
      }
    }
  },

  {
    fieldName: 'hideFrontpageComments',
    fieldSchema: {
      type: Boolean,
      optional: true,
      viewableBy: ['guests'],
      editableBy: ['admins'],
      insertableBy: ['admins'],
      control: 'checkbox',
      group: formGroups.moderationGroup,
    }
  },

  /**
    maxBaseScore: Highest baseScore this post ever had, used for RSS feed generation
  */

  {
    fieldName: 'maxBaseScore',
    fieldSchema: {
      type: Number,
      optional: true,
      viewableBy: ['guests'],
      hidden: true,
      onInsert: (document) => document.baseScore || 0,
    }
  },
  /**
    The timestamp when the post's maxBaseScore first exceeded 2
  */
  {
    fieldName: 'scoreExceeded2Date',
    fieldSchema: {
      type: Date,
      optional: true,
      viewableBy: ['guests'],
      onInsert: document => document.baseScore >= 2 && new Date()
    }
  },
  /**
    The timestamp when the post's maxBaseScore first exceeded 30
  */
  {
    fieldName: 'scoreExceeded30Date',
    fieldSchema: {
      type: Date,
      optional: true,
      viewableBy: ['guests'],
      onInsert: document => document.baseScore >= 30 && new Date()
    }
  },
  /**
    The timestamp when the post's maxBaseScore first exceeded 45
  */
  {
    fieldName: 'scoreExceeded45Date',
    fieldSchema: {
      type: Date,
      optional: true,
      viewableBy: ['guests'],
      onInsert: document => document.baseScore >= 45 && new Date()
    }
  },
  /**
    The timestamp when the post's maxBaseScore first exceeded 75
  */
  {
    fieldName: 'scoreExceeded75Date',
    fieldSchema: {
      type: Date,
      optional: true,
      viewableBy: ['guests'],
      onInsert: document => document.baseScore >= 75 && new Date()
    }
  },
  {
    fieldName: 'bannedUserIds',
    fieldSchema: {
      type: Array,
      viewableBy: ['members'],
      group: formGroups.moderationGroup,
      insertableBy: (currentUser, document) => Users.canModeratePost(currentUser, document),
      editableBy: (currentUser, document) => Users.canModeratePost(currentUser, document),
      optional: true,
      label: "Users banned from commenting on this post",
      control: "UsersListEditor",
    }
  },
  {
    fieldName: 'bannedUserIds.$',
    fieldSchema: {
      type: String,
      optional: true
    }
  },
  {
    fieldName: 'commentsLocked',
    fieldSchema: {
      type: Boolean,
      viewableBy: ['guests'],
      group: formGroups.moderationGroup,
      insertableBy: (currentUser, document) => Users.canCommentLock(currentUser, document),
      editableBy: (currentUser, document) => Users.canCommentLock(currentUser, document),
      optional: true,
      control: "checkbox",
    }
  },

  {
    fieldName: 'groupId',
    fieldSchema: {
      type: String,
      viewableBy: ['guests'],
      editableBy: ['sunshineRegiment'],
      insertableBy: ['members'],
      hidden: true,
      optional: true,
      resolveAs: {
        fieldName: 'group',
        addOriginalField: true,
        type: "Localgroup",
        resolver: (post, args, context) => {
          const group = context.Localgroups.findOne({_id: post.groupId});
          return Users.restrictViewableFields(context.currentUser, context.Localgroups, group);
        }
      }
    }
  },

  /*
    Event specific fields:
  */

  {
    fieldName: 'organizerIds',
    fieldSchema: {
      type: Array,
      viewableBy: ['guests'],
      insertableBy: ['members'],
      editableBy: ['members'],
      optional: true,
      hidden: true,
      control: "UsersListEditor",
      resolveAs: {
        fieldName: 'organizers',
        type: '[User]',
        resolver: (localEvent, args, context) => {
          return _.map(localEvent.organizerIds,
            (organizerId => {return context.Users.findOne({ _id: organizerId }, { fields: context.Users.getViewableFields(context.currentUser, context.Users) })})
          )
        },
        addOriginalField: true
      },
      group: formGroups.event,
    }
  },

  {
    fieldName: 'organizerIds.$',
    fieldSchema: {
      type: String,
      optional: true,
    }
  },

  {
    fieldName: 'groupId',
    fieldSchema: {
      type: String,
      viewableBy: ['guests'],
      editableBy: ['members'],
      insertableBy: ['members'],
      optional: true,
      hidden: true,
      group: formGroups.event,
      resolveAs: {
        fieldName: 'group',
        type: ['Localgroup'],
        resolver: (localEvent, args, context) => {
          return context.Localgroups.findOne({_id: localEvent.groupId}, {fields: context.Users.getViewableFields(context.currentUser, context.Localgroups)});
        },
        addOriginalField: true,
      }
    }
  },

  {
    fieldName: 'isEvent',
    fieldSchema: {
      type: Boolean,
      hidden: true,
      group: formGroups.event,
      viewableBy: ['guests'],
      editableBy: ['sunshineRegiment'],
      insertableBy: ['members'],
      optional: true
    }
  },

  {
    fieldName: 'reviewedByUserId',
    fieldSchema: {
      type: String,
      optional: true,
      viewableBy: ['guests'],
      editableBy: ['sunshineRegiment', 'admins'],
      insertableBy: ['sunshineRegiment', 'admins'],
      hidden: true,
      resolveAs: {
        fieldName: 'reviewedByUser',
        type: 'User',
        resolver: async (post, args, context) => {
          if (!post.reviewedByUserId) return null;
          const user = await context.Users.loader.load(post.reviewedByUserId);
          return context.Users.restrictViewableFields(context.currentUser, context.Users, user);
        },
        addOriginalField: true
      },
    }
  },

  {
    fieldName: 'reviewForCuratedUserId',
    fieldSchema: {
      type: String,
      optional: true,
      viewableBy: ['guests'],
      editableBy: ['sunshineRegiment', 'admins'],
      insertableBy: ['sunshineRegiment', 'admins'],
      group: formGroups.adminOptions,
      label: "Curated Review UserId"
    }
  },

  {
    fieldName: 'startTime',
    fieldSchema: {
      type: Date,
      hidden: (props) => !props.eventForm,
      viewableBy: ['guests'],
      editableBy: ['members'],
      insertableBy: ['members'],
      control: 'datetime',
      label: "Start Time",
      group: formGroups.event,
      optional: true,
    }
  },

  {
    fieldName: 'endTime',
    fieldSchema: {
      type: Date,
      hidden: (props) => !props.eventForm,
      viewableBy: ['guests'],
      editableBy: ['members'],
      insertableBy: ['members'],
      control: 'datetime',
      label: "End Time",
      group: formGroups.event,
      optional: true,
    }
  },

  {
    fieldName: 'mongoLocation',
    fieldSchema: {
      type: Object,
      viewableBy: ['guests'],
      insertableBy: ['members'],
      editableBy: ['members'],
      hidden: true,
      blackbox: true,
      optional: true
    }
  },

  {
    fieldName: 'googleLocation',
    fieldSchema: {
      type: Object,
      hidden: (props) => !props.eventForm,
      viewableBy: ['guests'],
      insertableBy: ['members'],
      editableBy: ['members'],
      label: "Group Location",
      control: 'LocationFormComponent',
      blackbox: true,
      group: formGroups.event,
      optional: true
    }
  },

  {
    fieldName: 'location',
    fieldSchema: {
      type: String,
      searchable: true,
      viewableBy: ['guests'],
      editableBy: ['members'],
      insertableBy: ['members'],
      hidden: true,
      optional: true
    }
  },

  {
    fieldName: 'contactInfo',
    fieldSchema: {
      type: String,
      hidden: (props) => !props.eventForm,
      viewableBy: ['guests'],
      insertableBy: ['members'],
      editableBy: ['members'],
      label: "Contact Info",
      control: "MuiInput",
      optional: true,
      group: formGroups.event,
    }
  },

  {
    fieldName: 'facebookLink',
    fieldSchema: {
      type: String,
      hidden: (props) => !props.eventForm,
      viewableBy: ['guests'],
      insertableBy: ['members'],
      editableBy: ['members'],
      label: "Facebook Event",
      control: "MuiInput",
      optional: true,
      group: formGroups.event,
    }
  },

  {
    fieldName: 'website',
    fieldSchema: {
      type: String,
      hidden: (props) => !props.eventForm,
      viewableBy: ['guests'],
      insertableBy: ['members'],
      editableBy: ['members'],
      control: "MuiInput",
      optional: true,
      group: formGroups.event,
    }
  },

  {
    fieldName: 'types',
    fieldSchema: {
      type: Array,
      viewableBy: ['guests'],
      insertableBy: ['members'],
      editableBy: ['members'],
      hidden: (props) => !props.eventForm,
      control: 'MultiSelectButtons',
      label: "Group Type:",
      group: formGroups.event,
      optional: true,
      form: {
        options: [
          {value: "LW", color: "rgba(100, 169, 105, 0.9)", hoverColor: "rgba(100, 169, 105, 0.5)"},
          {value: "SSC", color: "rgba(100, 169, 105, 0.9)", hoverColor: "rgba(100, 169, 105, 0.5)"},
          {value: "EA", color: "rgba(100, 169, 105, 0.9)", hoverColor: "rgba(100, 169, 105, 0.5)"},
          {value: "MIRIx", color: "rgba(100, 169, 105, 0.9)", hoverColor: "rgba(100, 169, 105, 0.5)"}
          // Alternative colorization, keep around for now
          // {value: "SSC", color: "rgba(136, 172, 184, 0.9)", hoverColor: "rgba(136, 172, 184, 0.5)"},
          // {value: "EA", color: "rgba(29, 135, 156,0.5)", hoverColor: "rgba(29, 135, 156,0.5)"},
          // {value: "MIRIx", color: "rgba(225, 96, 1,0.6)", hoverColor: "rgba(225, 96, 1,0.3)"}
        ]
      },
    }
  },

  {
    fieldName: 'types.$',
    fieldSchema: {
      type: String,
      optional: true,
    }
  },

  {
    fieldName: 'metaSticky',
    fieldSchema: {
      order:10,
      type: Boolean,
      optional: true,
      label: "Sticky (Meta)",
      defaultValue: false,
      group: formGroups.adminOptions,
      viewableBy: ['guests'],
      editableBy: ['admins'],
      insertableBy: ['admins'],
      control: 'checkbox',
      onInsert: (post) => {
        if(!post.metaSticky) {
          return false;
        }
      },
      onEdit: (modifier, post) => {
        if (!modifier.$set.metaSticky) {
          return false;
        }
      }
    }
  },

  {
    fieldName: 'sticky',
    fieldSchema: {
      order:10,
      group: formGroups.adminOptions
    }
  },

  {
    fieldName: 'postedAt',
    fieldSchema: {
      group: formGroups.adminOptions
    }
  },

  {
    fieldName: 'status',
    fieldSchema: {
      group: formGroups.adminOptions,
    }
  },

  {
    fieldName: 'shareWithUsers',
    fieldSchema: {
      type: Array,
      order: 15,
      viewableBy: ['guests'],
      insertableBy: ['members'],
      editableBy: ['members'],
      optional: true,
      control: "UsersListEditor",
      label: "Share draft with users",
      group: formGroups.options
    }
  },

  {
    fieldName: 'shareWithUsers.$',
    fieldSchema: {
      type: String,
      optional: true
    }
  },

  {
    fieldName: 'commentSortOrder',
    fieldSchema: {
      type: String,
      viewableBy: ['guests'],
      insertableBy: ['admins'],
      editableBy: ['admins'],
      optional: true,
      group: formGroups.adminOptions,
    }
  },

  /*
    hideAuthor: Post stays online, but doesn't show on your user profile anymore, and doesn't
    link back to your account
  */

  {
    fieldName: 'hideAuthor',
    fieldSchema: {
      type: Boolean,
      viewableBy: ['guests'],
      insertableBy: ['admins'],
      editableBy: ['admins'],
      optional: true,
      group: formGroups.adminOptions,
    }
  },
]);

makeEditable({
  collection: Posts,
  options: {
    formGroup: formGroups.content,
    adminFormGroup: formGroups.adminOptions,
    order: 25
  }
})
