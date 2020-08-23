import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';
import { Comments } from '../../lib/collections/comments';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    backgroundColor: "rgba(120,120,0,.08)"
  }
})

const SunshineNewCommentsList = ({ terms, classes }: {
  terms: any,
  classes: ClassesType,
}) => {
  const { results, totalCount=0 } = useMulti({
    terms,
    collection: Comments,
    fragmentName: 'CommentsListWithPostMetadata',
    enableTotal: true,
  });
  const { SunshineListCount, SunshineNewCommentsItem, SunshineListTitle } = Components
  
  if (results && results.length) {
    return (
      <div className={classes.root}>
        <SunshineListTitle>
          Unreviewed Comments <SunshineListCount count={totalCount}/>
        </SunshineListTitle>
        {results.map(comment =>
          <div key={comment._id} >
            <SunshineNewCommentsItem comment={comment}/>
          </div>
        )}
      </div>
    )
  } else {
    return null
  }
}

const SunshineNewCommentsListComponent = registerComponent('SunshineNewCommentsList', SunshineNewCommentsList, {styles});

declare global {
  interface ComponentTypes {
    SunshineNewCommentsList: typeof SunshineNewCommentsListComponent
  }
}

