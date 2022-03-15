import React from 'react'
import { registerComponent } from '../../lib/vulcan-lib/components';
import CKEditor from '../editor/ReactCKEditor';
import { getCkEditor } from '../../lib/wrapCkEditor';
import { generateTokenRequest } from '../../lib/ckEditorUtils';
import { ckEditorUploadUrlSetting, ckEditorWebsocketUrlSetting } from '../../lib/publicSettings'
import { ckEditorUploadUrlOverrideSetting, ckEditorWebsocketUrlOverrideSetting } from '../../lib/instanceSettings';

// Uncomment the import and the line below to activate the debugger
// import CKEditorInspector from '@ckeditor/ckeditor5-inspector';

const CKCommentEditor = ({ data, collectionName, fieldName, onSave, onChange, onInit }: {
  data?: any,
  collectionName: CollectionNameString,
  fieldName: string,
  onSave?: any,
  onChange?: any,
  onInit?: any,
}) => {
  const webSocketUrl = ckEditorWebsocketUrlOverrideSetting.get() || ckEditorWebsocketUrlSetting.get();
  const ckEditorCloudConfigured = !!webSocketUrl;
  const { CommentEditor } = getCkEditor();

  return <div>
    <CKEditor
      editor={CommentEditor}
      onInit={(editor) => {
        // Uncomment the line below and the import above to activate the debugger
        // CKEditorInspector.attach(editor)
        if (onInit) onInit(editor)
        return editor
      }}
      onChange={onChange}
      config={{
        cloudServices: ckEditorCloudConfigured ? {
          // A tokenUrl token is needed here in order for image upload to work.
          // (It's accessible via drag-and-drop onto the comment box, and is
          // stored on CkEditor's CDN.)
          //
          // The collaborative editor is not activated because no `websocketUrl`
          // or `documentId` is provided.
          tokenUrl: generateTokenRequest(collectionName, fieldName),
          uploadUrl: ckEditorUploadUrlOverrideSetting.get() || ckEditorUploadUrlSetting.get(),
        } : undefined,
        autosave: {
          save (editor) {
            return onSave && onSave( editor.getData() )
          }
        },
        initialData: data || ""
      }}
      data={data}
    />
  </div>
}

const CKCommentEditorComponent = registerComponent("CKCommentEditor", CKCommentEditor);
declare global {
  interface ComponentTypes {
    CKCommentEditor: typeof CKCommentEditorComponent
  }
}